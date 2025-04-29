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

        function waveify(text) {
          return text.split("")
            .map(char => `
              <span class="hover-letter">
                ${char}
                <button class="pick-me-btn" style="display: none;">Pick me</button>
              </span>
            `).join("");
        }

        const messageLines = (data.message || "").split("\n");
        const timestamp = data.timestamp?.toDate?.().toLocaleString() || "No timestamp";

        const $box = $(`
          <div class="entry-box">
            <div class="entry-message flower-text">
              ${messageLines.map(line => `<div class="message-line">${waveify(line)}</div>`).join("")}
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

      addHoverEffects(); // apply after all are added
    });
}

const colorPalette = [
  "rgb(216, 255, 58)",
  "rgb(201, 240, 226)",
  "rgb(216, 243, 108)",
  "rgb(255, 168, 254)",
  "rgb(226, 215, 255)",
  /* "rgb(181, 209, 255)", */
  "rgb(255, 210, 245)",
  /* "rgb(255, 202, 79)", */
  "rgb(255, 206, 206)"
];

function getRandomColorFromPalette() {
  const index = Math.floor(Math.random() * colorPalette.length);
  return colorPalette[index];
}

function addHoverEffects() {
  document.querySelectorAll('.hover-letter').forEach(span => {
    const btn = span.querySelector('.pick-me-btn');

    span.addEventListener('mouseenter', () => {
      const color = getRandomColorFromPalette();
      span.style.color = color;
      span.setAttribute('data-color', color); // store for later use
      btn.style.display = "block";
      
    });

    span.addEventListener('mouseleave', () => {
      span.style.color = '';
      btn.style.display = "none";
    });

    btn.addEventListener('click', (e) => {
      e.stopPropagation();
    
      const pickedChar = span.childNodes[0].textContent;
    
      const pickedLettersNew = document.getElementById("picked-letters-new");
      const pickedLettersGrid = document.getElementById("picked-letters-grid");
    
      // If there's already a big letter showing, move it down into the grid
      if (pickedLettersNew.firstChild) {
        const previousBigLetter = pickedLettersNew.firstChild;
        previousBigLetter.classList.remove("picked-letter-new");
        previousBigLetter.style.fontSize = "8rem";

        // Insert the previous big letter at the top of the grid
        if (pickedLettersGrid.firstChild) {
          pickedLettersGrid.insertBefore(previousBigLetter, pickedLettersGrid.firstChild);
        } else {
          pickedLettersGrid.appendChild(previousBigLetter);
        }
      }
    
      // Now add the new big letter
      const pickedLetter = document.createElement("div");
      pickedLetter.textContent = pickedChar;
      pickedLetter.classList.add("picked-letter", "picked-letter-new");
      pickedLetter.style.color = span.getAttribute("data-color") || "inherit";
    
      pickedLettersNew.innerHTML = "";
      pickedLettersNew.appendChild(pickedLetter);
    
      // Clear the picked letter from the message
      span.innerHTML = "&nbsp;";
      span.classList.remove("hover-letter");
      span.style.color = "transparent";
      span.style.pointerEvents = "none";
    });
    
    
    
  });
}

$(document).ready(function () {
  let isAboutInFront = false;

  $("#about-overlay").on("click", function () {
    isAboutInFront = !isAboutInFront;
    $(this).css("z-index", isAboutInFront ? 10000 : 0);
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

  $("#about-overlay").css("z-index", 0);
});

// Prevent picked-letters scroll from bubbling to the main page
document.getElementById('picked-letters-scroll').addEventListener('wheel', function(event) {
  event.stopPropagation();
}, { passive: false });

document.getElementById('print-button').addEventListener('click', function () {
  const printButton = this;

  printButton.textContent = "Preparing your print...";
  printButton.disabled = true;
  printButton.style.opacity = "0.6";

  setTimeout(() => {
    const printContent = `
      <html>
        <head>
          <title>Print Picked Letters</title>
          <style>
            @font-face {
              font-family: 'Flowers';
              src: url('https://enyajpan.github.io/in-case-of-loss/assets/pixel-flowers.ttf') format('truetype');
            }

            @page {
              size: landscape;
            }

            body {
              font-family: 'Flowers', sans-serif;
              font-size: 5rem;
              text-align: center;
              margin: 0;
              padding: 0;
              background: url('https://enyajpan.github.io/404-error/assets/404-error-print-bg.png') no-repeat center center;              
              background-size: cover;
              width: 11in;
              height: 8.5in;
            }

            #print-container {
              display: grid;
              grid-template-columns: repeat(4, 1fr);
              gap: 20px;
              margin: 1in;
            }

            .picked-letter-new {
              font-size: 12rem;
              grid-column: span 4;
            }

            .picked-letter {
              font-size: 6rem;
            }
          </style>
        </head>
        <body>
          <img class="print-background" src="https://enyajpan.github.io/404-error/assets/404-error-print-bg.png" alt="background"
            style="
              position: fixed;
              top: 0;
              left: 0;
              width: 11in;
              height: 8.5in;
              object-fit: cover;
              z-index: -1;
              pointer-events: none;
            " />

          <div id="print-container">
            ${document.getElementById('picked-letters-new').innerHTML}
            ${document.getElementById('picked-letters-grid').innerHTML}
          </div>
        </body>
      </html>
    `;

    const printWindow = window.open('', '', 'width=800,height=600');
    printWindow.document.open();
    printWindow.document.write(printContent);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
    printWindow.close();

    printButton.textContent = "Take Away";
    printButton.disabled = false;
    printButton.style.opacity = "1";
  }, 600);
});




