// Redraws mermaid diagrams in a hand-drawn style.
// Load after mermaid and svg2roughjs.
(() => {
    // Forced settings. Values from the page are merged under these.
    const HAND_DRAWN_MERMAID_CONFIG = {
        startOnLoad: false,
        look: "handDrawn",
        handDrawnSeed: 7,
        theme: "neutral",
        htmlLabels: false,
    };

    const originalInitialize = mermaid.initialize.bind(mermaid);
    mermaid.initialize = (userConfig) =>
        originalInitialize(Object.assign({}, userConfig, HAND_DRAWN_MERMAID_CONFIG));
    mermaid.initialize({});

    // Replaces the svg with a sketched copy and fits the viewBox to it.
    function sketchSvg(svg) {
        svg.setAttribute("width", svg.viewBox.baseVal.width);
        svg.setAttribute("height", svg.viewBox.baseVal.height);

        const converter = new svg2roughjs.Svg2Roughjs(document.createElement("div"));
        converter.svg = svg;
        converter.fontFamily = null;
        converter.randomize = false;
        converter.roughConfig = { roughness: 1.8, hachureGap: 6, fillWeight: 0.8, seed: 7 };

        return converter.sketch().then((sketchedSvg) => {
            svg.replaceWith(sketchedSvg);
            const bounds = sketchedSvg.getBBox();
            // 6 px margin on each side, so strokes are not cut.
            sketchedSvg.setAttribute(
                "viewBox",
                [bounds.x - 6, bounds.y - 6, bounds.width + 12, bounds.height + 12].join(" "),
            );
            sketchedSvg.removeAttribute("height");
            return { svg: sketchedSvg.outerHTML };
        });
    }

    const originalRender = mermaid.render.bind(mermaid);
    mermaid.render = (id, text, container) =>
        originalRender(id, text, container).then((result) => {
            container.innerHTML = result.svg;
            // Mermaid marks what it draws itself. svg2roughjs redraws the rest.
            const isAlreadySketched = container.querySelector('[data-look="handDrawn"]');
            return isAlreadySketched ? result : sketchSvg(container.firstElementChild);
        });
})();
