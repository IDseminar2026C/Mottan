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

// 「2026-09-29」の形の日付の、1週間後の日付を「2026-10-06」の形で返す
function addOneWeek(dateText) {
  const parts = dateText.split("-");
  // 時差でずれないように、世界共通の時間（UTC）で日付を作る
  // （日に 7 を足すと、月や年の終わりをまたいでも正しく次の月・年になる）
  const nextWeek = new Date(Date.UTC(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]) + 7));
  // 「2026-10-06T00:00:00.000Z」の形の文字から、先頭の10文字（年-月-日）だけを取り出す
  return nextWeek.toISOString().slice(0, 10);
}

// 日付が今日以降になるまで、1週間ずつ進めた日付を返す
function moveToTodayOrLater(dateText, today) {
  // 進めている途中の日付
  let date = dateText;
  while (date < today) {
    date = addOneWeek(date);
  }
  return date;
}

// 曜日の名前（番号の順：日曜が 0、月曜が 1 … 土曜が 6）
const WEEKDAY_NAMES = ["日", "月", "火", "水", "木", "金", "土"];

// 「曜日でくりかえす」で追加した持ち物かどうか（曜日の一覧を持っていれば true）
function isWeekdayItem(item) {
  return Array.isArray(item.weekdays);
}

// 日本時間の今日の曜日の番号を返す（日曜が 0、月曜が 1 … 土曜が 6）
function getTodayWeekday() {
  const parts = getTodayKey().split("-");
  const today = new Date(Date.UTC(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2])));
  return today.getUTCDay();
}

// 曜日の番号の一覧を「月・木」の形の文字にする（月曜から日曜の順に並べる）
function formatWeekdays(weekdays) {
  // 月曜を先頭にした並び順
  const order = [1, 2, 3, 4, 5, 6, 0];
  const names = [];
  for (const day of order) {
    if (weekdays.includes(day)) {
      names.push(WEEKDAY_NAMES[day]);
    }
  }
  return names.join("・");
}

// 過ぎた日（昨日より前）の持ち物を保存データから消す
// ただし「毎週」の持ち物は消さずに、今日以降になるまで日付を進める
function removePastItems() {
  // 今日の日付（「2026-09-29」の形）
  const today = getTodayKey();
  const items = loadItems();

  // 「毎週」の持ち物の日付を進める
  for (const item of items) {
    if (item.repeat === true) {
      item.date = moveToTodayOrLater(item.date, today);
    }
  }

  // 曜日の持ち物と、日付が今日か今日より後のものだけを残す
  // （「年-月-日」の形の文字は、そのまま大きさをくらべると日付の前後がわかる）
  const remainingItems = items.filter((item) => isWeekdayItem(item) || item.date >= today);
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
    // カードの中に出す日付（曜日の持ち物は「毎週 月・木」の形）
    const dateElement = document.createElement("span");
    dateElement.className = "item-date";
    if (isWeekdayItem(item)) {
      dateElement.textContent = "毎週 " + formatWeekdays(item.weekdays);
    } else {
      dateElement.textContent = formatDate(item.date);
    }
    content.appendChild(dateElement);
  }

  card.appendChild(content);
  card.appendChild(createDeleteButton(item.id));
  addSwipe(card);

  return card;
}

// 今日の持ち物かどうか（日付が今日か、曜日の持ち物で今日の曜日が選ばれていれば true）
function isTodayItem(item, today, todayWeekday) {
  if (isWeekdayItem(item)) {
    return item.weekdays.includes(todayWeekday);
  }
  return item.date === today;
}

// 保存されている持ち物のうち、今日の分だけをリストに表示する
function showItems() {
  // カードを並べる場所
  const listElement = document.getElementById("item-list");
  listElement.innerHTML = "";

  // 今日の日付（「2026-09-29」の形）と、今日の曜日の番号
  const today = getTodayKey();
  const todayWeekday = getTodayWeekday();
  const items = loadItems();
  // 作ったカードの枚数
  let count = 0;
  for (const item of items) {
    // 今日の分だけカードにする
    if (isTodayItem(item, today, todayWeekday)) {
      listElement.appendChild(createItemCard(item, false));
      count = count + 1;
    }
  }
  showEmptyMessage(count);
  // 明日以降の持ち物のリストも、いっしょに表示し直す
  showFutureItems();
}

// 保存されている持ち物のうち、明日以降のものを日付の早い順に表示する
// 曜日の持ち物は、日付の持ち物の下にまとめて表示する
function showFutureItems() {
  // カードを並べる場所
  const listElement = document.getElementById("future-list");
  listElement.innerHTML = "";

  // 今日の日付（「2026-09-29」の形）
  const today = getTodayKey();
  const items = loadItems();
  // 日付の持ち物のうち、日付が今日より後のものだけを集める
  const futureItems = items.filter((item) => !isWeekdayItem(item) && item.date > today);
  // 日付の早い順に並べる
  futureItems.sort((a, b) => a.date.localeCompare(b.date));
  // 曜日の持ち物（毎週くりかえすので、いつも表示する）
  const weekdayItems = items.filter((item) => isWeekdayItem(item));

  for (const item of futureItems.concat(weekdayItems)) {
    listElement.appendChild(createItemCard(item, true));
  }
  showFutureCount(futureItems.length + weekdayItems.length);
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

// 追加できたときのお知らせを表示する（空の文字を渡すとお知らせが消える）
function showSuccess(message) {
  const successElement = document.getElementById("success-message");
  successElement.textContent = message;
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

// 今えらんでいる登録のしかた（"date" は日付で登録、"weekday" は曜日でくりかえす）
let currentMode = "date";

// 「日付で登録」か「曜日でくりかえす」かを切り替える（mode は "date" か "weekday"）
function setMode(mode) {
  currentMode = mode;
  const dateButton = document.getElementById("mode-date");
  const weekdayButton = document.getElementById("mode-weekday");
  // 日付の欄（「曜日でくりかえす」のときは隠す）
  const dateArea = document.getElementById("date-area");
  // 曜日のボタンの欄（「日付で登録」のときは隠す）
  const weekdayArea = document.getElementById("weekday-area");

  // 選んでいるほうのボタンだけ青くする
  dateButton.classList.toggle("selected", mode === "date");
  weekdayButton.classList.toggle("selected", mode === "weekday");
  dateArea.hidden = mode === "weekday";
  weekdayArea.hidden = mode === "date";
}

// 曜日のボタンを押したら、選ぶ（青）と選ばない（白）を切り替える
function toggleWeekday(event) {
  event.currentTarget.classList.toggle("selected");
}

// 選んでいる曜日の番号の一覧を返す（例：月と木なら [1, 4]）
function getSelectedWeekdays() {
  const selectedButtons = document.querySelectorAll(".weekday-button.selected");
  const weekdays = [];
  for (const button of selectedButtons) {
    weekdays.push(Number(button.dataset.day));
  }
  return weekdays;
}

// 曜日のボタンを、全部「選ばない（白）」にもどす
function clearWeekdays() {
  const buttons = document.querySelectorAll(".weekday-button");
  for (const button of buttons) {
    button.classList.remove("selected");
  }
}

// 新しい持ち物を保存データに加える
function saveNewItem(newItem) {
  const items = loadItems();
  items.push(newItem);
  saveItems(items);
}

// 日付の持ち物を保存する（うまくいったらお知らせの文、足りないときは空の文字を返す）
function addDateItem(name) {
  // 選ばれた日付（「2026-09-29」の形）
  const date = document.getElementById("item-date").value;
  if (date === "") {
    showError("日付を選んでください");
    return "";
  }
  // id は、あとで削除するときに見分けるための番号
  saveNewItem({ id: Date.now(), name: name, date: date });
  // 例：「2026年10月3日に「教科書」を追加しました」
  return formatDate(date) + "に「" + name + "」を追加しました";
}

// 曜日の持ち物を保存する（うまくいったらお知らせの文、足りないときは空の文字を返す）
function addWeekdayItem(name) {
  const weekdays = getSelectedWeekdays();
  if (weekdays.length === 0) {
    showError("曜日を選んでください");
    return "";
  }
  // 曜日の持ち物は日付を持たず、曜日の一覧（weekdays）を持つ
  saveNewItem({ id: Date.now(), name: name, weekdays: weekdays });
  clearWeekdays();
  // 例：「毎週月・木曜日に「体操服」を追加しました」
  return "毎週" + formatWeekdays(weekdays) + "曜日に「" + name + "」を追加しました";
}

// 追加ボタンが押されたときの処理
function addItem() {
  // 入力された持ち物の名前（前後の空白は取りのぞく）
  const nameInput = document.getElementById("item-name");
  const name = nameInput.value.trim();

  if (name === "") {
    showError("持ち物・課題の名前を入力してください");
    showSuccess("");
    return;
  }

  // 今の登録のしかたに合わせて保存する
  let message = "";
  if (currentMode === "weekday") {
    message = addWeekdayItem(name);
  } else {
    message = addDateItem(name);
  }
  // 日付や曜日が足りなかったときは、ここで終わり
  if (message === "") {
    showSuccess("");
    return;
  }

  showError("");
  showSuccess(message);
  nameInput.value = "";
  // 過去の日付で追加されたときのために、日付を進める・消す処理をここでも動かす
  removePastItems();
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

// 切り替えボタンを押したら、日付の欄を出したり隠したりする
document.getElementById("mode-date").addEventListener("click", () => setMode("date"));
document.getElementById("mode-weekday").addEventListener("click", () => setMode("weekday"));

// 曜日のボタンを押したら、選ぶ・選ばないを切り替える
for (const button of document.querySelectorAll(".weekday-button")) {
  button.addEventListener("click", toggleWeekday);
}
