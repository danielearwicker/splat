const input = document.querySelector("#input") as HTMLTextAreaElement;
const output = document.querySelector("#output") as HTMLTextAreaElement;
const regex = document.querySelector("#regex") as HTMLInputElement;
const template = document.querySelector("#template") as HTMLInputElement;
const regexPanel = document.querySelector("#regex-panel") as HTMLDivElement;

input.value = `Amazing Show 3x09.mkv
Amazing Show 3x10.mkv
Amazing Show 4x01.mkv
Amazing Show 4x02.mkv`;

regex.value = "0?(\\d+)x0?(\\d+).mkv";

template.value = "Amazing Show s${1:00}e${2:00} Season ${1} Episode ${2}.mkv";

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

input.addEventListener("input", update);
regex.addEventListener("input", update);
template.addEventListener("input", update);

update();
