const navigation = [...document.querySelectorAll(".station-button")];
const lessons = [...document.querySelectorAll(".lesson")];
const drawer = document.querySelector(".drawer");
const railScroll = document.querySelector(".rail-scroll");
const previous = document.querySelector("#previous-page");
const next = document.querySelector("#next-page");
const pageCount = document.querySelector("#page-count");
const fruit = [...document.querySelectorAll("[data-apple]")];
const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)");

let current = -1;
let pending = -1;
let transition;
let openedQuestion;

function closeQuestion(restoreFocus = false) {
  if (!openedQuestion) return;
  const { button, answer } = openedQuestion;
  button.setAttribute("aria-expanded", "false");
  answer.hidden = true;
  openedQuestion = undefined;
  if (restoreFocus) button.focus();
}

function revealQuestion(button) {
  closeQuestion();
  const answer = document.getElementById(button.getAttribute("aria-controls"));
  answer.hidden = false;
  button.setAttribute("aria-expanded", "true");
  openedQuestion = { button, answer };
  answer.focus({ preventScroll: true });
  answer.scrollIntoView({ block: "nearest" });
}

function renderPage(index) {
  closeQuestion();
  current = pending = index;
  lessons.forEach((lesson, i) => {
    lesson.hidden = i !== index;
  });
  navigation.forEach((link, i) => {
    if (i === index) link.setAttribute("aria-current", "step");
    else link.removeAttribute("aria-current");
  });
  pageCount.textContent = `步骤 ${index + 1} / ${lessons.length}`;
  previous.disabled = index === 0;
  next.disabled = index === lessons.length - 1;
  drawer.dataset.light = "on";
}

function showPage(index, { writeHash = false, focus = false, question } = {}) {
  if (index < 0 || index >= lessons.length) return;
  clearTimeout(transition);
  pending = index;
  if (writeHash && location.hash !== `#${lessons[index].id}`) {
    history.pushState(null, "", `#${lessons[index].id}`);
  }
  const finish = () => {
    if (index !== current || current === -1) renderPage(index);
    else drawer.dataset.light = "on";
    if (focus || question) {
      const stage = navigation[index].getBoundingClientRect();
      const rail = railScroll.getBoundingClientRect();
      if (stage.left < rail.left || stage.right > rail.right) {
        railScroll.scrollLeft += stage.left - rail.left - (rail.width - stage.width) / 2;
      }
    }
    if (question) revealQuestion(question);
    else if (focus) {
      const heading = lessons[index].querySelector("h2");
      heading.focus({ preventScroll: true });
      heading.scrollIntoView({ block: "nearest", behavior: "instant" });
    }
  };
  if (current === -1 || current === index || reducedMotion.matches) {
    finish();
  } else {
    drawer.dataset.light = "off";
    transition = setTimeout(finish, 170);
  }
}

function hashStage() {
  return lessons.findIndex((lesson) => `#${lesson.id}` === location.hash);
}

document.querySelectorAll("[data-stage]").forEach((link) => {
  link.addEventListener("click", (event) => {
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    const index = lessons.findIndex((lesson) => lesson.id === link.dataset.stage);
    showPage(index, { writeHash: true, focus: true });
  });
});
previous.addEventListener("click", () => showPage(pending - 1, { writeHash: true, focus: true }));
next.addEventListener("click", () => showPage(pending + 1, { writeHash: true, focus: true }));
window.addEventListener("hashchange", () => showPage(Math.max(0, hashStage())));
fruit.forEach((button) => {
  button.addEventListener("click", () => {
    if (openedQuestion?.button === button) {
      closeQuestion();
      return;
    }
    const index = lessons.findIndex((lesson) => lesson.id === button.dataset.owner);
    showPage(index, { writeHash: true, question: button });
  });
});
document.querySelectorAll("[data-close]").forEach((button) => {
  button.addEventListener("click", () => closeQuestion(true));
});
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && openedQuestion) closeQuestion(true);
});
document.querySelectorAll(".apple-answer").forEach((answer) => { answer.hidden = true; });
document.documentElement.classList.add("has-js");
showPage(Math.max(0, hashStage()));

const modelButtons = [...document.querySelectorAll("[data-model]")];
const positionButtons = [...document.querySelectorAll("[data-position]")];
const visibilityResult = document.querySelector("#visibility-result");
let model = "encoder";
let position = 1;

function updateVisibility() {
  modelButtons.forEach((button) => {
    button.setAttribute("aria-pressed", String(button.dataset.model === model));
  });
  const visible = [];
  positionButtons.forEach((button, index) => {
    const canRead = model === "encoder" || index <= position;
    button.dataset.visible = String(canRead);
    button.setAttribute("aria-pressed", String(position === index));
    if (canRead) visible.push(`「${button.textContent}」`);
  });
  visibilityResult.textContent = `更新「${positionButtons[position].textContent}」时，可参考${visible.join("、")}。`;
}
modelButtons.forEach((button) => button.addEventListener("click", () => {
  model = button.dataset.model;
  updateVisibility();
}));
positionButtons.forEach((button, index) => button.addEventListener("click", () => {
  position = index;
  updateVisibility();
}));

const attentionStages = [
  { title: "从当前向量投影出 Q、K、V", numbers: ["—", "—", "—", "Q = (0, 3)", "—", "—"], formula: "(1, 2, −1) × WQ → (0, 3)", note: "「它」的 Q 去匹配各位置的 K。V 提供被读取的内容。" },
  { title: "「它」的 Q 与六个位置的 K 做点积", numbers: ["3", "0", "0", "0", "6", "9"], formula: "(0, 3) · (0, 1) = 3", note: "此时右侧的「立刻」和「飞」原始分数更高。真正的权重还没算出来。" },
  { title: "缩放之后，用因果 Mask 挡住右侧位置", numbers: ["2.12", "0", "0", "0", "−∞", "−∞"], formula: "3 ÷ √2 ≈ 2.12", note: "「立刻」和「飞」处于当前 token 的右侧。它们的匹配分数再高，也不会获得注意力权重。" },
  { title: "Softmax 把可见位置的分数变成权重", numbers: ["0.735", "0.088", "0.088", "0.088", "0", "0"], formula: "softmax([2.12, 0, 0, 0, −∞, −∞])", note: "四个可见位置权重之和约为 1。显示值经过四舍五入，右侧位置权重为 0。" },
  { title: "按照权重汇总四个位置的 V", numbers: ["(2,0)", "(0,1)", "(0,2)", "(1,1)", "0 权重", "0 权重"], formula: "0.735·(2,0) + 0.088·(0,1) + 0.088·(0,2) + 0.088·(1,1) ≈ (1.56, 0.35)", note: "最后一个加权项是「它」自己的 V。整条加权式得到的是一个注意力头的输出。" },
  { title: "一个头算完了，这一层还要加工", numbers: [], formula: "多头合并 → WO → 残差 → Norm → FFN → 残差", note: "这才是当前层交给下一层的「它」向量。下一层用自己的参数重新计算 Q、K、V。" },
];
const stageButtons = [...document.querySelectorAll("[data-attention]")];
const scoreRibbon = document.querySelector(".score-ribbon");
const scoreCells = [...scoreRibbon.children];
const attentionNext = document.querySelector("#attention-next");
let attention = 0;

function updateAttention(index) {
  attention = index;
  const stage = attentionStages[index];
  document.querySelector("#attention-label").textContent = stage.title;
  document.querySelector("#attention-equation").textContent = stage.formula;
  document.querySelector("#attention-caption").textContent = stage.note;
  scoreRibbon.hidden = stage.numbers.length === 0;
  scoreCells.forEach((cell, column) => {
    cell.querySelector("b").textContent = stage.numbers[column] || "";
    cell.classList.toggle("muted", index >= 2 && index <= 4 && column >= 4);
    cell.classList.toggle("observed", column === 3);
  });
  stageButtons.forEach((button, i) => button.setAttribute("aria-pressed", String(i === index)));
  attentionNext.textContent = index === attentionStages.length - 1 ? "从头再算 ↺" : "继续算下一步 →";
}
stageButtons.forEach((button, index) => button.addEventListener("click", () => updateAttention(index)));
attentionNext.addEventListener("click", () => updateAttention((attention + 1) % attentionStages.length));
updateAttention(0);

const branchButtons = [...document.querySelectorAll("[data-branch]")];
branchButtons.forEach((button) => button.addEventListener("click", () => {
  const at = button.dataset.branch === "at";
  branchButtons.forEach((item) => item.setAttribute("aria-pressed", String(item === button)));
  document.querySelectorAll("[data-input]").forEach((item) => { item.textContent = at ? "小鸟｜在" : "小鸟"; });
  document.querySelectorAll("[data-target]").forEach((item) => { item.textContent = at ? "唱歌" : "在"; });
}));
