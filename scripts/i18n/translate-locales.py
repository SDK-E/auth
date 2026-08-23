#!/usr/bin/env python3
"""Translate and reconcile sharded next-intl message catalogs."""

from __future__ import annotations

import argparse
import json
import os
import re
import sys
import tempfile
import time
import urllib.parse
import urllib.request
from pathlib import Path
from typing import Any, Dict, List, Union

LOCALES_DIRECTORY = Path("apps/platform/src/locales")
ENGLISH_DIRECTORY = LOCALES_DIRECTORY / "en"
STATE_FILE = LOCALES_DIRECTORY / ".translation-state.json"
SUPPORTED_LOCALES = (
    "fr", "de", "es", "pt", "it", "nl", "sv", "no", "da", "fi",
    "pl", "cs", "hu", "ro", "bg", "el",
)
GOOGLE_ENDPOINT = "https://translate.googleapis.com/translate_a/single"
LIBRETRANSLATE_URL = os.environ.get("LIBRETRANSLATE_URL", "https://libretranslate.com").rstrip("/")
LIBRETRANSLATE_API_KEY = os.environ.get("LIBRETRANSLATE_API_KEY", "")
def _load_env_file(path: Path) -> None:
    try:
        for line in path.read_text(encoding="utf-8").splitlines():
            line = line.strip()
            if not line or line.startswith("#") or "=" not in line:
                continue
            key, _, value = line.partition("=")
            os.environ.setdefault(key.strip(), value.strip().strip('"').strip("'"))
    except OSError:
        pass


_load_env_file(Path(".env.local"))
DEEPL_API_KEY = os.environ.get("DEEPL_API_KEY", "")
# DeepL splits its API by plan: ":fx" keys belong to api-free.deepl.com.
DEEPL_ENDPOINT = (
    "https://api-free.deepl.com/v2/translate"
    if DEEPL_API_KEY.endswith(":fx")
    else "https://api.deepl.com/v2/translate"
)
DEEPL_TARGET_LANGUAGES = {"no": "NB"}
PROTECTED_TERMS = (
    "Auth0 (Okta)", "SDK Enterprises", "SADDEK Entreprises",
    "Articles 15 to 22 GDPR", "Art. 30 GDPR", "Art. 6(1)(b)",
    "Art. 6(1)(c)", "Art. 6(1)(f)", "RCS Paris", "www.cnil.fr",
    "Vercel Analytics", "Spring Boot", "JetBrains Mono", "PostgreSQL",
    "Elasticsearch", "TypeScript", "Kubernetes", "MongoDB", "Laravel",
    "Symfony", "Node.js", "Tailwind", "Shadcn", "MySQL", "Redis",
    "Valkey", "Vercel", "Resend", "Neon", "Upstash", "SIREN", "SIRET",
    "GDPR", "RGPD", "CNIL", "LCEN", "CCPA", "CPRA", "CI/CD", "B2B",
    "SaaS", "LLM", "RAG", "PHP", "Java", "React", "Vue", "Nuxt", "AWS",
    "GCP", "Azure", "Helm", "APIs", "API", "Chrome", "Firefox",
    "Safari", "Edge", "SDK", "OAuth 2.1", "OIDC", "PKCE", "JWT",
    "WebAuthn", "SAML", "RS256", "AES-256-GCM", "SHA-256",
    "auth.sdk.enterprises", "sdk.enterprises", "hello@sdk.enterprises",
    "44 Rue Pasquier, 75008 Paris, France", "sdk_e_session",
)
TRANSLATION_MARKER = "ZXQTRANSLATIONSPLIT8F4C2AQXZ"
INTERPOLATION_PATTERN = re.compile(r"\{([^{}]+)\}")
LEAKED_MARKER_PATTERN = re.compile(r"ZXQ|QXZ|__PRESERVE|\[TRANSLATE")

JsonValue = Union[
    str, int, float, bool, None, List["JsonValue"], Dict[str, "JsonValue"]
]


def read_json(path: Path) -> JsonValue:
    with path.open(encoding="utf-8") as file:
        return json.load(file)


def write_json_atomic(path: Path, value: JsonValue) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with tempfile.NamedTemporaryFile(
        "w", encoding="utf-8", dir=path.parent, delete=False
    ) as file:
        json.dump(value, file, ensure_ascii=False, indent=2)
        file.write("\n")
        temporary_path = Path(file.name)
    temporary_path.replace(path)


def catalog_files(directory: Path) -> list[Path]:
    if not directory.is_dir():
        return []
    return sorted(path.relative_to(directory) for path in directory.rglob("*.json"))


def merge_messages(target: dict[str, JsonValue], source: dict[str, JsonValue]) -> dict[str, JsonValue]:
    result = dict(target)
    for key, source_value in source.items():
        target_value = result.get(key)
        if isinstance(source_value, dict) and isinstance(target_value, dict):
            result[key] = merge_messages(target_value, source_value)
        elif key in result:
            raise RuntimeError(f"duplicate message key while merging: {key}")
        else:
            result[key] = source_value
    return result


def load_catalog(directory: Path) -> tuple[dict[Path, dict[str, JsonValue]], dict[str, JsonValue]]:
    shards: dict[Path, dict[str, JsonValue]] = {}
    messages: dict[str, JsonValue] = {}
    for relative_path in catalog_files(directory):
        value = read_json(directory / relative_path)
        if not isinstance(value, dict):
            raise RuntimeError(f"{directory / relative_path}: catalog shard must be an object")
        shards[relative_path] = value
        messages = merge_messages(messages, value)
    return shards, messages


def flatten_strings(value: JsonValue, key_path: str = "root", result: dict[str, str] | None = None) -> dict[str, str]:
    flattened = {} if result is None else result
    if isinstance(value, str):
        flattened[key_path] = value
    elif isinstance(value, list):
        for index, item in enumerate(value):
            flatten_strings(item, f"{key_path}[{index}]", flattened)
    elif isinstance(value, dict):
        for key, item in value.items():
            flatten_strings(item, f"{key_path}.{key}", flattened)
    return flattened


def protect(text: str) -> str:
    protected = INTERPOLATION_PATTERN.sub(
        lambda match: f"ZXQV{match.group(1).upper()}QXZ", text
    )
    for index, term in enumerate(PROTECTED_TERMS):
        protected = protected.replace(term, f"ZXQP{index}QXZ")
    return protected


def unprotect(text: str) -> str:
    restored = text
    for index, term in enumerate(PROTECTED_TERMS):
        restored = restored.replace(f"ZXQP{index}QXZ", term)
    restored = re.sub(
        r"ZXQV([A-Z0-9_]+)QXZ",
        lambda match: "{" + match.group(1).lower() + "}",
        restored,
    )
    if LEAKED_MARKER_PATTERN.search(restored):
        raise RuntimeError(f"unresolved preservation marker in: {restored}")
    return restored


def translate_batch_google(texts: list[str], target_locale: str) -> list[str]:
    query = f"\n{TRANSLATION_MARKER}\n".join(texts)
    parameters = urllib.parse.urlencode(
        {"client": "gtx", "sl": "en", "tl": target_locale, "dt": "t", "q": query}
    )
    request = urllib.request.Request(
        f"{GOOGLE_ENDPOINT}?{parameters}",
        headers={"User-Agent": "Mozilla/5.0"},
    )
    with urllib.request.urlopen(request, timeout=30) as response:
        data = json.loads(response.read())
    translated = "".join(segment[0] for segment in data[0] if segment[0])
    parts = re.split(rf"\s*{re.escape(TRANSLATION_MARKER)}\s*", translated)
    if len(parts) != len(texts):
        raise RuntimeError(
            f"translation batch split mismatch: expected {len(texts)}, got {len(parts)}"
        )
    return parts


def translate_batch_libre(texts: list[str], target_locale: str) -> list[str]:
    payload: Dict[str, Any] = {
        "q": texts,
        "source": "en",
        "target": target_locale,
        "format": "text",
    }
    if LIBRETRANSLATE_API_KEY:
        payload["api_key"] = LIBRETRANSLATE_API_KEY
    request = urllib.request.Request(
        f"{LIBRETRANSLATE_URL}/translate",
        data=json.dumps(payload).encode("utf-8"),
        headers={"Content-Type": "application/json"},
    )
    with urllib.request.urlopen(request, timeout=30) as response:
        data = json.loads(response.read())
    translated = data.get("translatedText")
    if isinstance(translated, str):
        translated = [translated]
    if not isinstance(translated, list) or len(translated) != len(texts):
        raise RuntimeError(
            f"LibreTranslate batch mismatch: expected {len(texts)} results"
        )
    return [str(item) for item in translated]


def translate_batch(texts: list[str], target_locale: str, provider: str = "google") -> list[str]:
    if provider == "libre":
        return translate_batch_libre(texts, target_locale)
    return translate_batch_google(texts, target_locale)


def translate_batch_deepl(texts: list[str], target_locale: str) -> list[str]:
    payload = {
        "text": texts,
        "target_lang": DEEPL_TARGET_LANGUAGES.get(target_locale, target_locale.upper()),
        "source_lang": "EN",
    }
    request = urllib.request.Request(
        DEEPL_ENDPOINT,
        data=json.dumps(payload).encode("utf-8"),
        headers={
            "Content-Type": "application/json",
            "Authorization": f"DeepL-Auth-Key {DEEPL_API_KEY}",
        },
    )
    with urllib.request.urlopen(request, timeout=30) as response:
        data = json.loads(response.read())
    translations = data.get("translations")
    if not isinstance(translations, list) or len(translations) != len(texts):
        raise RuntimeError(f"DeepL batch mismatch: expected {len(texts)} results")
    return [str(item["text"]) for item in translations]


def translate_batch(texts: list[str], target_locale: str, provider: str = "google") -> list[str]:
    if provider == "libre":
        return translate_batch_libre(texts, target_locale)
    if provider == "deepl":
        return translate_batch_deepl(texts, target_locale)
    return translate_batch_google(texts, target_locale)


def translate_with_fallback(
    texts: list[str], target_locale: str
) -> list[str]:
    """DeepL first when configured; then Google; LibreTranslate as last resort."""
    providers: list[tuple[str, Any]] = []
    if DEEPL_API_KEY:
        providers.append(("deepl", lambda: translate_batch_deepl(texts, target_locale)))
    providers.append(
        ("google", lambda: translate_batch_google(texts, target_locale))
    )
    providers.append(
        ("libretranslate", lambda: translate_batch_libre(texts, target_locale))
    )
    failures: list[str] = []
    for name, attempt in providers:
        try:
            return attempt()
        except Exception as error:
            failures.append(f"{name}: {error}")
    raise RuntimeError("; ".join(failures))


def translate_strings(texts: list[str], locale: str) -> dict[str, str]:
    translations: dict[str, str] = {}
    unique_texts = list(dict.fromkeys(texts))
    for offset in range(0, len(unique_texts), 10):
        batch = unique_texts[offset : offset + 10]
        last_error: Exception | None = None
        for attempt in range(3):
            try:
                results = translate_with_fallback(
                    [protect(text) for text in batch], locale
                )
                translations.update(
                    {source: unprotect(result) for source, result in zip(batch, results)}
                )
                last_error = None
                break
            except Exception as error:  # Network and upstream payload errors are retried together.
                last_error = error
                time.sleep(0.5 * (attempt + 1))
        if last_error is not None:
            # Some target languages cause Google Translate to rewrite or drop
            # the batch delimiter. Retain batching as the fast path, then
            # translate the affected batch one string at a time so catalog
            # reconciliation remains reliable.
            for source in batch:
                single_error: Exception | None = None
                for attempt in range(3):
                    try:
                        result = translate_with_fallback([protect(source)], locale)
                        translations[source] = unprotect(result[0])
                        single_error = None
                        break
                    except Exception as error:
                        single_error = error
                        time.sleep(0.5 * (attempt + 1))
                if single_error is not None:
                    raise RuntimeError(
                        f"{locale}: translation failed at batch {offset}: {single_error}"
                    ) from single_error
        time.sleep(0.05)
    return translations


def value_at_path(value: JsonValue, key_path: str) -> JsonValue | object:
    current: JsonValue = value
    for key, index in re.findall(r"\.([^.[\]]+)|\[(\d+)\]", key_path.removeprefix("root")):
        if key:
            if not isinstance(current, dict) or key not in current:
                return _MISSING
            current = current[key]
        else:
            position = int(index)
            if not isinstance(current, list) or position >= len(current):
                return _MISSING
            current = current[position]
    return current


_MISSING = object()


def rebuild(
    source: JsonValue,
    existing: JsonValue | object,
    key_path: str,
    translated_paths: set[str],
    translations: dict[str, str],
) -> JsonValue:
    if isinstance(source, str):
        if key_path in translated_paths or not isinstance(existing, str):
            return translations[source]
        return existing
    if isinstance(source, list):
        old = existing if isinstance(existing, list) else []
        return [
            rebuild(
                item,
                old[index] if index < len(old) else _MISSING,
                f"{key_path}[{index}]",
                translated_paths,
                translations,
            )
            for index, item in enumerate(source)
        ]
    if isinstance(source, dict):
        old = existing if isinstance(existing, dict) else {}
        return {
            key: rebuild(
                item,
                old.get(key, _MISSING),
                f"{key_path}.{key}",
                translated_paths,
                translations,
            )
            for key, item in source.items()
        }
    return source


def validate_value(source: JsonValue, target: JsonValue, key_path: str, errors: list[str]) -> None:
    if isinstance(source, str):
        if not isinstance(target, str):
            errors.append(f"{key_path}: expected string")
            return
        if sorted(INTERPOLATION_PATTERN.findall(source)) != sorted(
            INTERPOLATION_PATTERN.findall(target)
        ):
            errors.append(f"{key_path}: interpolation variables changed")
        if LEAKED_MARKER_PATTERN.search(target):
            errors.append(f"{key_path}: unresolved translation marker")
        return
    if isinstance(source, list):
        if not isinstance(target, list) or len(source) != len(target):
            errors.append(f"{key_path}: array shape differs from English")
            return
        for index, item in enumerate(source):
            validate_value(item, target[index], f"{key_path}[{index}]", errors)
        return
    if isinstance(source, dict):
        if not isinstance(target, dict):
            errors.append(f"{key_path}: expected object")
            return
        if list(source) != list(target):
            errors.append(f"{key_path}: keys or key order differ from English")
            return
        for key, item in source.items():
            validate_value(item, target[key], f"{key_path}.{key}", errors)
        return
    if type(source) is not type(target):
        errors.append(f"{key_path}: value type differs from English")


def validate_catalog(
    english_shards: dict[Path, dict[str, JsonValue]],
    target_shards: dict[Path, dict[str, JsonValue]],
    locale: str,
) -> None:
    errors: list[str] = []
    english_files = list(english_shards)
    target_files = list(target_shards)
    if english_files != target_files:
        missing = sorted(set(english_files) - set(target_files))
        extra = sorted(set(target_files) - set(english_files))
        if missing:
            errors.append("missing files: " + ", ".join(map(str, missing)))
        if extra:
            errors.append("extra files: " + ", ".join(map(str, extra)))
    for relative_path in set(english_files) & set(target_files):
        validate_value(
            english_shards[relative_path],
            target_shards[relative_path],
            str(relative_path),
            errors,
        )
    if errors:
        raise RuntimeError(f"{locale} validation failed:\n  " + "\n  ".join(errors))


def remove_extra_files(directory: Path, expected: set[Path]) -> None:
    for relative_path in catalog_files(directory):
        if relative_path not in expected:
            (directory / relative_path).unlink()
    for child in sorted(directory.rglob("*"), reverse=True):
        if child.is_dir() and not any(child.iterdir()):
            child.rmdir()


def parse_arguments() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Incrementally translate and reconcile next-intl catalog shards."
    )
    parser.add_argument("locales", nargs="*", metavar="LOCALE")
    parser.add_argument(
        "--all", action="store_true", help="Retranslate every string."
    )
    parser.add_argument(
        "--check", action="store_true", help="Validate without network access or writes."
    )
    parser.add_argument(
        "--record", action="store_true", help="Record validated catalogs as the baseline."
    )
    arguments = parser.parse_args()
    arguments.locales = arguments.locales or list(SUPPORTED_LOCALES)
    unsupported = sorted(set(arguments.locales) - set(SUPPORTED_LOCALES))
    if unsupported:
        parser.error(f"unsupported locale(s): {', '.join(unsupported)}")
    return arguments


def main() -> None:
    arguments = parse_arguments()
    english_shards, english_messages = load_catalog(ENGLISH_DIRECTORY)
    if not english_shards:
        raise RuntimeError(f"no English catalog shards found in {ENGLISH_DIRECTORY}")
    english_strings = flatten_strings(english_messages)
    state_value = read_json(STATE_FILE) if STATE_FILE.exists() else {}
    if not isinstance(state_value, dict):
        raise RuntimeError(f"{STATE_FILE}: state must be an object")
    state: dict[str, Any] = state_value

    for locale in arguments.locales:
        locale_directory = LOCALES_DIRECTORY / locale
        target_shards, target_messages = load_catalog(locale_directory)

        if arguments.check:
            validate_catalog(english_shards, target_shards, locale)
            if state.get(locale) != english_strings:
                raise RuntimeError(f"{locale}: translation baseline is stale")
            print(f"{locale}: OK")
            continue

        if arguments.record:
            validate_catalog(english_shards, target_shards, locale)
            state[locale] = english_strings
            print(f"{locale}: baseline recorded")
            continue

        previous = state.get(locale, {})
        if not isinstance(previous, dict):
            previous = {}
        translated_paths = {
            key_path
            for key_path, english_text in english_strings.items()
            if arguments.all
            or previous.get(key_path) != english_text
            or not isinstance(value_at_path(target_messages, key_path), str)
        }
        translations = translate_strings(
            [english_strings[key_path] for key_path in translated_paths], locale
        )

        for relative_path, english_shard in english_shards.items():
            rebuilt = rebuild(
                english_shard,
                target_messages,
                "root",
                translated_paths,
                translations,
            )
            write_json_atomic(locale_directory / relative_path, rebuilt)
        remove_extra_files(locale_directory, set(english_shards))

        updated_shards, _ = load_catalog(locale_directory)
        validate_catalog(english_shards, updated_shards, locale)
        state[locale] = english_strings
        print(
            f"{locale}: updated {len(translated_paths)} translated strings"
            if translated_paths
            else f"{locale}: structure reconciled; translations already current"
        )

    if not arguments.check:
        write_json_atomic(STATE_FILE, state)


if __name__ == "__main__":
    try:
        main()
    except (OSError, RuntimeError, json.JSONDecodeError) as error:
        print(error, file=sys.stderr)
        sys.exit(1)
