import { gsap } from "/scripts/greensock/esm/all.js";
import Settings from "./Settings.mjs";
import Logger from "./Logger.mjs";
import QueueHandler from "./QueueHandler.mjs";
import ChatHandler from "./ChatHandler.mjs";

export default class LayoutDrawer {

    static DEBUGGING_LAYOUT = false;
    static secondsPerWord = 0.5
    static animatedSecondsPerWord = 0.3
    static minimumTimeOnscreen = 5
    static timeBetweenScrolling = 0.5

    // constructor() {
    //     return (async () => {

    //         LayoutDrawer.secondsPerWord = await Settings.get("secondsPerWord");
    //         LayoutDrawer.animatedSecondsPerWord = await Settings.get("animatedSecondsPerWord");
    //         LayoutDrawer.minimumTimeOnscreen = await Settings.get("minimumTimeOnScreen");
    //         LayoutDrawer.timeBetweenScrolling = await Settings.get("timeBetweenScrolling");

    //         if (!await Settings.get("debugMode")) {
    //             LayoutDrawer.DEBUGGING_LAYOUT = false;
    //         }

    //         return this;
    //     })();
    // }

    static async addSpeakingActor(chatDisplayData) {
        var previousLength = QueueHandler.onscreen.length;
        QueueHandler.onscreen.push(chatDisplayData.name);
        Logger.log("Appending " + chatDisplayData.name);

        let html = `<div id="V${chatDisplayData.id}" class="vino-chat-frame" style="display:none;">`;
        html += `<img src="${chatDisplayData.img}" class="vino-chat-actor-portrait" />`;
        html += `<div class="vino-chat-flexy-boi">`;
        html += `  <div class="vino-chat-body">`
        html += `    <div class="vino-chat-actor-name">${chatDisplayData.name}</div>`;
        html += `    <div class="vino-chat-emotion-flare">${chatDisplayData.mood}</div>`;
        html += `    <div id="V${chatDisplayData.id}-vino-chat-text-body" class="vino-chat-text-body">`;
        html += `      <p id="V${chatDisplayData.id}-vino-chat-text-paragraph" style="font: ${chatDisplayData.font}"></p>`;
        html += `    </div>`;
        html += `  </div>`;
        html += `</div>`;
        html += `</div>`;

        $("#vino-chat-lane")
            .append(html);

        if (previousLength == 0) {
            Logger.log("Showing vino overlay");
            $("#vino-overlay").fadeIn(500);
        }
        $("#V" + chatDisplayData.id + ".vino-chat-frame").fadeIn(500);

        Logger.log("Appended " + chatDisplayData.name);

        chatDisplayData.text = LayoutDrawer._removeExtraneousHtml(chatDisplayData.text);

        if (chatDisplayData.isEmoting) {
            chatDisplayData.text = `<i>${chatDisplayData.text}</i>`;
        }
        else if (chatDisplayData.skipAutoQuote) {
            Logger.log("Skipping autoquote");
        }
        else if (Settings.get('autoQuote')) {
            chatDisplayData.text = `${await Settings.get('quoteOpening')}${chatDisplayData.text}${await Settings.get('quoteClosing')}`;
        }

        gsap.to(`#V${chatDisplayData.id}-vino-chat-text-paragraph`, LayoutDrawer._wordCount(chatDisplayData.text) * LayoutDrawer.animatedSecondsPerWord, { text: { value: `${chatDisplayData.text}`, delimiter: "" }, ease: "none" });

        var scrollFn = setInterval(function () {
            gsap.to(`#V${chatDisplayData.id}-vino-chat-text-body`, LayoutDrawer.timeBetweenScrolling / 1000, { scrollTo: "max" });
        }, LayoutDrawer.timeBetweenScrolling * 1000);

        var timeout = LayoutDrawer._wordCount(chatDisplayData.text) * (1000 * LayoutDrawer.secondsPerWord);
        if (timeout < (LayoutDrawer.minimumTimeOnscreen * 1000)) {
            timeout = (LayoutDrawer.minimumTimeOnscreen * 1000);
        }

        if (!LayoutDrawer.DEBUGGING_LAYOUT) {
            setTimeout(function () {
                clearInterval(scrollFn);
                let frame = $("#V" + chatDisplayData.id + ".vino-chat-frame");
                frame.fadeOut(1000, function () {
                    frame.remove();
                    QueueHandler.remove(chatDisplayData.name);
                    QueueHandler.progress();
                });
            }, timeout);
        }
    }

    static _removeExtraneousHtml(messageText) {

        messageText = ChatHandler._caseInsensitiveReplace(messageText, "<p>", "");
        messageText = ChatHandler._caseInsensitiveReplace(messageText, "</p>", "");

        return messageText.trim();
    }

    static _wordCount(str) { 
        return str.split(" ").length;
    }
}
