const firebaseConfig = {
  apiKey: "AIzaSyAidIgPo_dkrLV2FmJGqgGELdEGlV2pXkM",
  authDomain: "risd-dp.firebaseapp.com",
  projectId: "risd-dp",
  storageBucket: "risd-dp.firebasestorage.app",
  messagingSenderId: "640654886959",
  appId: "1:640654886959:web:5be3dd3866004a224e1eda",
  measurementId: "G-JCQFDHPH74"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();


function makeLinks() {
  db.collection("entries")
    .orderBy("timestamp", "desc")
    .onSnapshot((snapshot) => {
      $("#container").empty();

      snapshot.forEach((doc) => {
        const data = doc.data();
        const labels = data.label || [];

        if (!labels.includes("404-error")) return;

        const messageLines = (data.message || "").split("\n");
        const timestamp = data.timestamp?.toDate?.().toLocaleString() || "No timestamp";

        const $box = $(`
          <div class="entry-box">
            <div class="entry-message">
              ${messageLines.map(line => `<div class="message-line">${line}</div>`).join("")}
            </div>
            <div class="entry-meta-side">
              <div class="meta-id">${data.number || ""}</div>
              <div class="meta-title">${data["subject line"] || ""}</div>
              <div class="meta-author">${data.author || ""}</div>
              <div class="meta-timestamp">${timestamp}</div>
            </div>
          </div>
        `);

        $("#container").append($box);
      });
    });
}


$(document).ready(function () {
  let isAboutInFront = false;

  $("#about-overlay").on("click", function () {
    isAboutInFront = !isAboutInFront;

    if (isAboutInFront) {
      $(this).css("z-index", 10000);
    } else {
      $(this).css("z-index", 0);
    }
  });

  makeLinks();

  $("#close-thank-you").on("click", function () {
    $("#thank-you-popup").fadeOut(100);
  });

  $("#submission-form").on("submit", async function (e) {
    e.preventDefault();

    const subject = $('input[name="subject line"]').val().trim();
    const author = $('input[name="author"]').val().trim();
    const message = $('textarea[name="message"]').val().trim();
    const labels = $('input[name="label"]:checked');

    let hasError = false;
    if (!subject) { $("#error-subject").text("Required"); hasError = true; }
    if (!author) { $("#error-author").text("Required"); hasError = true; }
    if (!message) { $("#error-message").text("Required"); hasError = true; }
    if (labels.length === 0) { $("#error-label").text("Choose one"); hasError = true; }

    if (hasError) return;

    try {
      const snapshot = await db.collection("entries").orderBy("timestamp", "desc").get();
      const newNumber = String(snapshot.size + 1).padStart(3, "0");

      const formData = {
        "subject line": subject,
        author: author,
        message: message,
        label: Array.from(labels).map(cb => cb.value),
        number: newNumber,
        timestamp: new Date()
      };

      await db.collection("entries").add(formData);
      this.reset();
      $("#thank-you-popup").fadeIn(200);
    } catch (err) {
      console.error("Error submitting:", err);
    }
  });

  // Send about.png to the back
  $("#about-overlay").css("z-index", 0);
});
