const REDACTED = "[redacted]";
/** A credential under any other key name is transmitted. */
const CREDENTIAL_NAMES = [
  "token",
  "password",
  "passwort",
  "passwd",
  "secret",
  "key",
  "apikey",
  "authorization",
  "auth",
];
const AUTHORIZATION_SCHEMES = ["bearer", "basic"];

export function sanitize(message: string): string {
  return redactCredentialValues(
    redactUrlCredentials(redactAuthorizationValues(message)),
  );
}

function redactAuthorizationValues(message: string): string {
  let redactNext = false;
  return message
    .split(/(?<=\s)/)
    .map((piece) => {
      const word = piece.trimEnd();
      const [prefix, core, suffix] = splitPunctuation(word);
      if (core === "") {
        return piece;
      }
      if (redactNext) {
        redactNext = false;
        return `${prefix}${REDACTED}${suffix}${piece.slice(word.length)}`;
      }
      redactNext = isAuthorizationScheme(core);
      return piece;
    })
    .join("");
}

function redactUrlCredentials(message: string): string {
  let redacted = "";
  let rest = message;
  let index = rest.indexOf("://");
  while (index !== -1) {
    redacted += rest.slice(0, index + 3);
    const after = rest.slice(index + 3);
    const end = after.search(/[\s/?#)\]"'>]/);
    const authority = end === -1 ? after : after.slice(0, end);
    const at = authority.lastIndexOf("@");
    redacted += at === -1 ? authority : REDACTED + authority.slice(at);
    rest = after.slice(authority.length);
    index = rest.indexOf("://");
  }
  return redacted + rest;
}

function redactCredentialValues(message: string): string {
  const identifier = /[A-Za-z0-9_.-]+/y;
  let redacted = "";
  let position = 0;
  while (position < message.length) {
    identifier.lastIndex = position;
    const name = identifier.exec(message)?.[0];
    if (!name) {
      redacted += message[position];
      position += 1;
      continue;
    }

    const value = isCredentialName(name)
      ? credentialValue(message.slice(position + name.length))
      : undefined;
    if (value) {
      redacted +=
        message.slice(position, position + name.length + value.start) +
        REDACTED;
      position += name.length + value.end;
    } else {
      redacted += name;
      position += name.length;
    }
  }
  return redacted;
}

/**
 * Covers `key=value`, `key: value` and JSON's `"key":"value"`.
 * An unterminated quoted value, such as a truncated token, runs to the end.
 */
function credentialValue(
  afterKey: string,
): { start: number; end: number } | undefined {
  let index = /^["']/.test(afterKey) ? 1 : 0;
  index += leadingBlanks(afterKey.slice(index));
  if (!/^[=:]/.test(afterKey.slice(index))) {
    return undefined;
  }
  index += 1;
  index += leadingBlanks(afterKey.slice(index));

  const value = afterKey.slice(index);
  const quote = value[0];
  if (quote === '"' || quote === "'") {
    const start = index + 1;
    const closing = afterKey.indexOf(quote, start);
    const end = closing === -1 ? afterKey.length : closing;
    return end > start ? { start, end } : undefined;
  }

  const terminator = value.search(/[\s&,;"')\]}<>#]/);
  const length = terminator === -1 ? value.length : terminator;
  return length > 0 && !isAuthorizationScheme(value.slice(0, length))
    ? { start: index, end: index + length }
    : undefined;
}

function leadingBlanks(text: string): number {
  return text.length - text.replace(/^[ \t]+/, "").length;
}

function isCredentialName(identifier: string): boolean {
  const lastSegment = identifier.slice(identifier.search(/[^.\-_]*$/));
  return CREDENTIAL_NAMES.includes(lastSegment.toLowerCase());
}

function isAuthorizationScheme(word: string): boolean {
  return AUTHORIZATION_SCHEMES.includes(word.toLowerCase());
}

function splitPunctuation(word: string): [string, string, string] {
  const start = word.length - word.replace(/^[()[\]'",]+/, "").length;
  const core = word.slice(start).replace(/[()[\]'",.:;!?]+$/, "");
  return [word.slice(0, start), core, word.slice(start + core.length)];
}
