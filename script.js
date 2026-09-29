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

// 日本時間の今日の日付を「2026-09-29」の形の文字にする（保存した日付とくらべるため）
function getTodayKey() {
  // "en-CA" を使うと「年-月-日」の形で日付が作られる
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Tokyo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
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

// 過ぎた日（昨日より前）の持ち物を保存データから消す
function removePastItems() {
  // 今日の日付（「2026-09-29」の形）
  const today = getTodayKey();
  const items = loadItems();
  // 日付が今日か、今日より後のものだけを残す
  // （「年-月-日」の形の文字は、そのまま大きさをくらべると日付の前後がわかる）
  const remainingItems = items.filter((item) => item.date >= today);
  saveItems(remainingItems);
}

// 指定した番号（id）の持ち物を保存データから消して、リストを表示し直す
function deleteItem(id) {
  const items = loadItems();
  // 消したい持ち物以外だけを残す
  const remainingItems = items.filter((item) => item.id !== id);
  saveItems(remainingItems);
  showItems();
}

// 赤いマイナスの削除アイコンを作る
function createDeleteButton(id) {
  const button = document.createElement("button");
  button.className = "delete-button";
  button.type = "button";
  button.textContent = "−";
  button.addEventListener("click", () => deleteItem(id));
  return button;
}

// マウスを使う画面（パソコン）かどうかを調べる（style.css の切り替えと同じ条件）
function isComputer() {
  return window.matchMedia("(hover: hover) and (pointer: fine)").matches;
}

// スマホで、カードを左にスワイプしたら開き、右にスワイプしたら閉じる
function addSwipe(card) {
  // パソコンでは、タッチパネルがあってもスワイプしない
  if (isComputer()) {
    return;
  }

  // 指を置いた位置
  let startX = 0;
  let startY = 0;

  card.addEventListener("touchstart", (event) => {
    startX = event.touches[0].clientX;
    startY = event.touches[0].clientY;
  });

  card.addEventListener("touchend", (event) => {
    // 指を離すまでに、横と縦にどれだけ動いたか
    const moveX = event.changedTouches[0].clientX - startX;
    const moveY = event.changedTouches[0].clientY - startY;

    // 縦に大きく動いたときはスクロールなので、何もしない
    if (Math.abs(moveY) > Math.abs(moveX)) {
      return;
    }
    if (moveX < -40) {
      card.classList.add("opened");
    } else if (moveX > 40) {
      card.classList.remove("opened");
    }
  });
}

// 持ち物1つぶんのカードを作る（showDate が true のときは、名前の下に日付も出す）
function createItemCard(item, showDate) {
  // カード全体
  const card = document.createElement("li");
  card.className = "item-card";

  // 名前と日付をまとめた部分（スワイプすると左にずれる）
  const content = document.createElement("div");
  content.className = "card-content";
  content.textContent = item.name;

  if (showDate) {
    // カードの中に出す日付
    const dateElement = document.createElement("span");
    dateElement.className = "item-date";
    dateElement.textContent = formatDate(item.date);
    content.appendChild(dateElement);
  }

  card.appendChild(content);
  card.appendChild(createDeleteButton(item.id));
  addSwipe(card);

  return card;
}

// 保存されている持ち物のうち、今日の日付のものだけをリストに表示する
function showItems() {
  // カードを並べる場所
  const listElement = document.getElementById("item-list");
  listElement.innerHTML = "";

  // 今日の日付（「2026-09-29」の形）
  const today = getTodayKey();
  const items = loadItems();
  // 作ったカードの枚数
  let count = 0;
  for (const item of items) {
    // 日付が今日と同じものだけカードにする
    if (item.date === today) {
      listElement.appendChild(createItemCard(item, false));
      count = count + 1;
    }
  }
  showEmptyMessage(count);
  // 明日以降の持ち物のリストも、いっしょに表示し直す
  showFutureItems();
}

// 保存されている持ち物のうち、明日以降のものを日付の早い順に表示する
function showFutureItems() {
  // カードを並べる場所
  const listElement = document.getElementById("future-list");
  listElement.innerHTML = "";

  // 今日の日付（「2026-09-29」の形）
  const today = getTodayKey();
  // 日付が今日より後のものだけを集める
  const futureItems = loadItems().filter((item) => item.date > today);
  // 日付の早い順に並べる
  futureItems.sort((a, b) => a.date.localeCompare(b.date));

  for (const item of futureItems) {
    listElement.appendChild(createItemCard(item, true));
  }
  showFutureCount(futureItems.length);
}

// 見出しに件数を出し、0件のときだけ「明日以降の持ち物はありません」と表示する
function showFutureCount(count) {
  const titleElement = document.getElementById("future-title");
  titleElement.textContent = "明日以降の持ち物（" + count + "件）";

  const emptyElement = document.getElementById("future-empty-message");
  if (count === 0) {
    emptyElement.textContent = "明日以降の持ち物はありません";
  } else {
    emptyElement.textContent = "";
  }
}

// 今日の持ち物が0件のときだけ「今日の準備物はありません」と表示する
function showEmptyMessage(count) {
  const emptyElement = document.getElementById("empty-message");
  if (count === 0) {
    emptyElement.textContent = "今日の準備物はありません";
  } else {
    emptyElement.textContent = "";
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
removePastItems();
showItems();

// 追加ボタンを押したら addItem を動かす
document.getElementById("add-button").addEventListener("click", addItem);

// 日付の欄を押したらカレンダーを開き、日付を選んだら表示を変える
const dateInput = document.getElementById("item-date");
dateInput.addEventListener("click", openCalendar);
dateInput.addEventListener("change", showSelectedDate);
