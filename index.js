// just some exploration!!

let currentListener = null;

function signal(initial) {
    let value = initial;
    const subscribers = new Set();

    return {
        get value() {
            if (currentListener) subscribers.add(currentListener);
            return value;
        },
        set value(next) {
            value = next;
            subscribers.forEach((fn) => fn());
        },
    };
}

function effect(fn) {
    currentListener = fn;
    fn(); // run -> trigger getters -> auto subscribe
    currentListener = null;
}

function el(tag, ...args) {
    const node = document.createElement(tag);
    let children = args;

    // this is not very nice
    if (args[0] !== null && typeof args[0] === "object" && !(args[0] instanceof Node)) {
        applyProps(node, args[0]);
        children = args.slice(1);
    }

    for (const child of children) {
        if (typeof child === "function") {
            const marker = document.createComment("");
            node.appendChild(marker);
            let current = null;

            effect(() => {
                const result = child();
                const next =
                    result instanceof Node ? result : document.createTextNode(String(result));

                if (current) current.replaceWith(next);
                else marker.after(next);

                current = next;
            });
        } else if (child instanceof Node) {
            node.appendChild(child);
        } else if (child != null) {
            node.appendChild(document.createTextNode(String(child)));
        }
    }

    return node;
}

function applyProps(node, props) {
    for (const [key, val] of Object.entries(props)) {
        if (key.startsWith("on")) {
            node.addEventListener(key.slice(2), val);
        } else if (typeof val === "function") {
            // reactive attribute
            effect(() => {
                const v = val();
                // just testing buttons very ugly and directly for now
                if (node.tagName === "BUTTON" && key === "disabled") {
                    if (v === true) node.setAttribute(key, v);
                    else node.removeAttribute(key);
                } else {
                    node.setAttribute(key, v);
                }
            });
        } else {
            if (node.tagName === "BUTTON" && key === "disabled") {
                if (val === true || val === "true") node.setAttribute(key, val);
                else node.removeAttribute(key);
            } else {
                node.setAttribute(key, val);
            }
        }
    }
}

const div = (...args) => el("div", ...args);
const span = (...args) => el("span", ...args);
const button = (...args) => el("button", ...args);

const Counter = (props) => {
    const count = signal(props.initial);
    const count2 = signal(0);

    return div(
        span(() => `${props.label}: ${count.value}`),
        button(
            {
                onclick: () => {
                    count.value++;
                    count2.value++;
                },
                test: "",
                disabled: () => count.value >= 15,
            },
            "Increment"
        ),
        button(
            {
                onclick: () => {
                    count.value--;
                    count2.value++;
                },
                test: 2,
                disabled: () => count.value <= 0,
            },
            "Decrement"
        ),
        // going nuts with nesting and seeing if we can handle it
        span(() => div(() => div(() => `Total Clicks: ${count2.value}`)))
    );
};

document.getElementById("app").appendChild(Counter({label: "Count", initial: 0}));
