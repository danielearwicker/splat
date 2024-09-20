const input = document.querySelector("#input") as HTMLTextAreaElement;
const output = document.querySelector("#output") as HTMLTextAreaElement;
const regex = document.querySelector("#regex") as HTMLInputElement;
const template = document.querySelector("#template") as HTMLInputElement;
const regexPanel = document.querySelector("#regex-panel") as HTMLDivElement;

input.value = `beatles/1-love-me-do.mp3
beatles/2-she-loves-you.mp3
beatles/3-paperback-writer.mp3
kinks/1-sunny-afternoon.mp3
kinks/2-waterloo-sunset.mp3`;

regex.value = "([a-z]+)/(\\d+)-([a-z-]+).mp3";

template.value = "artist ${1} track ${2:00} title ${3}";

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
