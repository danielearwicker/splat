const input = document.querySelector("#input") as HTMLTextAreaElement;
const output = document.querySelector("#output") as HTMLTextAreaElement;
const regex = document.querySelector("#regex") as HTMLInputElement;
const template = document.querySelector("#template") as HTMLInputElement;
const mode = document.querySelector("#mode") as HTMLSelectElement;
const regexPanel = document.querySelector("#regex-panel") as HTMLDivElement;

input.value = `Amazing Show 3x09.mkv
Amazing Show 3x10.mkv
Amazing Show 4x01.mkv
Amazing Show 4x02.mkv`;

function pushAll<T>(target: T[], source: T[]) {
    for (const i of source) {
        target.push(i);
    }
}

export function summarise(strings: string[]) {
    if (strings.length == 0) {
        return [];
    }

    if (strings.length == 1) {
        return [strings];
    }

    // Reduce to distinct: sort and remove adjacent if same
    strings = strings.slice().sort();
    for (let n = 1; n < strings.length; n++) {
        if (strings[n] === strings[n - 1]) {
            strings.splice(n - 1, 1);
            n--;
        }
    }

    // Try substrings, longest first
    const first = strings[0];
    const len = first.length;
    for (let count = len; count > 0; count--) {
        for (let start = 0; start <= len - count; start++) {
            const sub = first.substring(start, start + count);

            const positions = strings.map((s) => s.indexOf(sub));
            if (positions.some((p) => p === -1)) {
                // Substring is not common to all
                continue;
            }

            const result: string[][] = [];

            if (positions.some((p) => p !== 0)) {
                pushAll(
                    result,
                    summarise(
                        positions.map((p, i) => strings[i].substring(0, p))
                    )
                );
            }

            result.push([sub]);

            if (positions.some((p, i) => p + sub.length < strings[i].length)) {
                pushAll(
                    result,
                    summarise(
                        positions.map((p, i) => strings[i].substring(p + count))
                    )
                );
            }

            return result;
        }
    }

    // No common substring found
    return [strings];
}

const digits = /^\d+$/;

function allDigits(variants: string[]) {
    return variants.every((s) => !s || s.match(digits));
}

function simplifySummary(summary: string[][]) {
    // combine adjacent sections if all digits
    for (let n = 1; n < summary.length; n++) {
        if (allDigits(summary[n - 1]) && allDigits(summary[n])) {
            pushAll(summary[n - 1], summary[n]);
            summary.splice(n, 1);
            n--;
        }
    }
}

function escapeRegExp(str: string) {
    return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function generateRegexFromSummary(summary: string[][]) {
    return (
        "^" +
        summary
            .map((s) =>
                s.length == 1
                    ? escapeRegExp(s[0])
                    : allDigits(s)
                    ? "(\\d*)"
                    : "(.*)"
            )
            .join("") +
        "$"
    );
}

function generateTemplateRef(index: number) {
    const kind = mode.value === "mv" ? "q" : "m";
    const ref = kind + "[" + index + "]";
    return "${" + ref + "}";
}

export function generateTemplateFromSummary(summary: string[][]) {
    let i = 0;

    let tmpl = summary
        .map((s) => (s.length == 1 ? s[0] : generateTemplateRef(++i)))
        .join("");

    if (mode.value === "mv") {
        return "`mv '" + tmpl + "' '" + tmpl + "'`";
    }

    return "`" + tmpl + "`";
}

function configure() {
    const summary = summarise(
        input.value.split("\n").filter((line) => line.trim())
    );

    simplifySummary(summary);

    regex.value = generateRegexFromSummary(summary);
    template.value = generateTemplateFromSummary(summary);
    update();
}

const escapeQuotePattern = /'/g;

function compile(tmpl: string): (m: RegExpExecArray, q: string[]) => string {
    return (m, q) => new Function("m", "q", "return " + tmpl)(m, q);
}

function update() {
    try {
        const r = new RegExp(regex.value);

        const compiled = compile(template.value);

        output.value = input.value
            .split("\n")
            .filter((line) => line.trim())
            .map((line) => {
                const m = r.exec(line);
                if (!m) return "";
                const q = Array.from(m).map((x) =>
                    x.replaceAll(escapeQuotePattern, "'\\''")
                );
                return compiled(m, q);
            })
            .join("\n");

        regexPanel.className = "panel";
    } catch (e) {
        regexPanel.className = "panel error";
        output.value = e.message;
    }
}

input.addEventListener("input", configure);
regex.addEventListener("input", update);
template.addEventListener("input", update);
mode.addEventListener("change", configure);

configure();
