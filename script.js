// 日本時間の今日の日付を「2026年9月29日（火）」の形の文字にする
function getTodayText() {
  // 日本時間（Asia/Tokyo）で日付を作るための設定
  const formatter = new Intl.DateTimeFormat("ja-JP", {
    timeZone: "Asia/Tokyo",
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "short",
  });
  return formatter.format(new Date());
}

// ヘッダーに今日の日付を表示する
function showToday() {
  // 日付を表示する場所
  const todayElement = document.getElementById("today");
  todayElement.textContent = getTodayText();
}

// localStorage に保存するときのキーの名前
const STORAGE_KEY = "giridai-list";

// 保存されている持ち物の一覧を読み込む（まだ何もなければ空の一覧）
function loadItems() {
  const savedText = localStorage.getItem(STORAGE_KEY);
  if (savedText === null) {
    return [];
  }
  return JSON.parse(savedText);
}

// 持ち物の一覧を localStorage に保存する
function saveItems(items) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

// 「2026-09-29」の形の日付を「2026年9月29日」の形の文字にする
function formatDate(dateText) {
  const parts = dateText.split("-");
  return Number(parts[0]) + "年" + Number(parts[1]) + "月" + Number(parts[2]) + "日";
}

// 持ち物1つぶんのカードを作る
function createItemCard(item) {
  // カード全体
  const card = document.createElement("li");
  card.className = "item-card";
  card.textContent = item.name;

  // カードの中に出す日付
  const dateElement = document.createElement("span");
  dateElement.className = "item-date";
  dateElement.textContent = formatDate(item.date);
  card.appendChild(dateElement);

  return card;
}

// 保存されている持ち物をリストに表示する（今はまだ全部表示する）
function showItems() {
  // カードを並べる場所
  const listElement = document.getElementById("item-list");
  listElement.innerHTML = "";

  const items = loadItems();
  for (const item of items) {
    listElement.appendChild(createItemCard(item));
  }
}

// 注意の文を表示する（空の文字を渡すと注意が消える）
function showError(message) {
  const errorElement = document.getElementById("error-message");
  errorElement.textContent = message;
}

// 日付の欄を押したら、カレンダーを開く（パソコンのブラウザ用）
function openCalendar() {
  const dateInput = document.getElementById("item-date");
  try {
    dateInput.showPicker();
  } catch (error) {
    // カレンダーを開く命令が使えないブラウザでは、何もしない
  }
}

// 選んだ日付を「2026年9月29日」の形で表示する
function showSelectedDate() {
  const date = document.getElementById("item-date").value;
  // 「日付を選択してください」を表示している場所
  const dateText = document.getElementById("date-text");

  if (date === "") {
    dateText.textContent = "日付を選択してください";
    dateText.classList.remove("selected");
  } else {
    dateText.textContent = formatDate(date);
    dateText.classList.add("selected");
  }
}

// 追加ボタンが押されたときの処理
function addItem() {
  // 入力された持ち物の名前（前後の空白は取りのぞく）
  const nameInput = document.getElementById("item-name");
  const name = nameInput.value.trim();
  // 選ばれた日付（「2026-09-29」の形）
  const date = document.getElementById("item-date").value;

  if (name === "") {
    showError("持ち物・課題の名前を入力してください");
    return;
  }
  if (date === "") {
    showError("日付を選んでください");
    return;
  }

  // 新しい持ち物（id は、あとで削除するときに見分けるための番号）
  const newItem = { id: Date.now(), name: name, date: date };
  const items = loadItems();
  items.push(newItem);
  saveItems(items);

  showError("");
  nameInput.value = "";
  showItems();
}

showToday();
showItems();

// 追加ボタンを押したら addItem を動かす
document.getElementById("add-button").addEventListener("click", addItem);

// 日付の欄を押したらカレンダーを開き、日付を選んだら表示を変える
const dateInput = document.getElementById("item-date");
dateInput.addEventListener("click", openCalendar);
dateInput.addEventListener("change", showSelectedDate);
