const input = document.querySelector("#input") as HTMLTextAreaElement;
const output = document.querySelector("#output") as HTMLTextAreaElement;
const regex = document.querySelector("#regex") as HTMLInputElement;
const template = document.querySelector("#template") as HTMLInputElement;
const regexPanel = document.querySelector("#regex-panel") as HTMLDivElement;

input.value = `Amazing Show 3x09.mkv
Amazing Show 3x10.mkv
Amazing Show 4x01.mkv
Amazing Show 4x02.mkv`;

// regex.value = "0?(\\d+)x0?(\\d+).mkv";
// template.value = "Amazing Show s${1:00}e${2:00} Season ${1} Episode ${2}.mkv";

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

function generateTemplateRef(variants: string[], index: number) {
    if (allDigits(variants)) {
        const length = variants
            .map((x) => x.length)
            .reduce((l, r) => Math.max(l, r));
        const pattern = "0".repeat(length);
        return "${" + index + ":" + pattern + "}";
    }

    return "${" + index + "}";
}

export function generateTemplateFromSummary(summary: string[][]) {
    let i = 0;
    return summary
        .map((s) => (s.length == 1 ? s[0] : generateTemplateRef(s, ++i)))
        .join("");
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

function compile(part: string, plain: boolean) {
    if (plain) {
        return () => part;
    }

    const colon = part.indexOf(":");
    if (colon === -1) {
        return (m: RegExpExecArray) => m[part];
    }

    const index = part.substring(0, colon);
    const pattern = part.substring(colon + 1);

    return (m: RegExpExecArray) => {
        const value = m[index];
        return pattern.substring(0, pattern.length - value.length) + value;
    };
}

function update() {
    // output.value = summarise(
    //     input.value.split("\n").filter((line) => line.trim())
    // ).join("\n");
    // return;

    try {
        const r = new RegExp(regex.value);

        const parts = template.value
            .split(/\$\{([\d:]+)\}/g)
            .map((p, i) => compile(p, i % 2 === 0));

        output.value = input.value
            .split("\n")
            .filter((line) => line.trim())
            .map((line) => {
                const m = r.exec(line);
                if (!m) return "";
                return parts.map((p) => p(m)).join("");
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

configure();
