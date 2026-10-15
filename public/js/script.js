let allBooks = [];
const fallbackCover = "https://placehold.co/400x550/F4EBDD/702C3B?text=Books";

function esc(value) {
  return String(value ?? "").replace(/[&<>"']/g, ch => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  })[ch]);
}

const isbnByTitle = {
  "Wings of Fire":"8173711461", "The Alchemist":"0061122416",
  "Rich Dad Poor Dad":"1612680194", "Harry Potter":"0439708184",
  "Clean Code":"0132350882", "The Psychology of Money":"0857197681",
  "Deep Work":"1455586692", "The Guide":"0143039644"
};

function makeCard(book) {
  const isbn = isbnByTitle[book.title];
  const cover = isbn ? `https://covers.openlibrary.org/b/isbn/${isbn}-L.jpg` : fallbackCover;
  return `<article class="book-card"><div class="book-image-wrapper">
  <img class="book-cover" src="${cover}" alt="Cover of ${esc(book.title)}" loading="lazy" onerror="this.onerror=null;this.src='${fallbackCover}'">
  <span class="book-id">BOOK #${esc(book.book_id)}</span></div><div class="book-details">
  <span class="book-category">${esc(book.category)}</span><h3>${esc(book.title)}</h3><p class="book-author">by ${esc(book.author)}</p>
  <div class="book-bottom"><strong class="book-price">₹${Number(book.price).toFixed(2)}</strong><span class="stock-badge">${esc(book.stock)} in stock</span></div>
  <button class="details-btn" data-book-id="${esc(book.book_id)}" type="button">View details ↗</button></div></article>`;
}

function draw(books, gridId, countId) {
  const grid = document.getElementById(gridId);
  if (!grid) return;
  grid.innerHTML = books.length ? books.map(makeCard).join("") : '<p class="empty-message">No books found. Try another search.</p>';
  if (countId) document.getElementById(countId).textContent = `${books.length} books`;
}

async function loadBooks() {
  try {
    const response = await fetch("/api/books");
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || "Could not load books.");
    allBooks = data;
    draw(allBooks.slice(0, 4), "homeBookGrid");
    draw(allBooks, "bookGrid", "resultCount");
    const total = document.getElementById("totalBooks");
    const cats = document.getElementById("categoryCount");
    const stock = document.getElementById("totalStock");
    if (total) total.textContent = allBooks.length;
    if (cats) cats.textContent = new Set(allBooks.map(b => b.category)).size;
    if (stock) stock.textContent = allBooks.reduce((n, b) => n + Number(b.stock), 0);
    const select = document.getElementById("categoryFilter");
    if (select) select.innerHTML = '<option value="all">All categories</option>' +
      [...new Set(allBooks.map(b => b.category))].sort().map(c => `<option value="${esc(c)}">${esc(c)}</option>`).join("");
  } catch (error) {
    document.querySelectorAll("#homeBookGrid, #bookGrid").forEach(el => el.innerHTML =
      `<p class="empty-message">${esc(error.message)} Check app.js and MySQL.</p>`);
  }
}

function filterBooks() {
  const q = (document.getElementById("searchInput")?.value || "").toLowerCase();
  const category = document.getElementById("categoryFilter")?.value || "all";
  draw(allBooks.filter(b =>
    [b.book_id, b.title, b.author, b.category].some(v => String(v).toLowerCase().includes(q)) &&
    (category === "all" || b.category === category)
  ), "bookGrid", "resultCount");
}

async function request(url, options = {}) {
  const response = await fetch(url, { headers: {"Content-Type":"application/json"}, ...options });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.message || "Request failed.");
  return data;
}
function show(id, text, error = false) {
  const el = document.getElementById(id);
  if (el) { el.textContent = text; el.classList.toggle("error-message", error); }
}

document.addEventListener("DOMContentLoaded", () => {
  const menu = document.querySelector(".menu-toggle");
  const nav = document.querySelector(".main-nav");
  menu?.addEventListener("click", () => nav.classList.toggle("open"));

  document.getElementById("searchInput")?.addEventListener("input", filterBooks);
  document.getElementById("categoryFilter")?.addEventListener("change", filterBooks);

  document.getElementById("addBookForm")?.addEventListener("submit", async e => {
    e.preventDefault();
    const form = e.currentTarget;
    try {
      const result = await request("/api/books", {method:"POST", body:JSON.stringify(Object.fromEntries(new FormData(form)))});
      show("addBookMessage", `${result.message} New ID: ${result.book_id}`);
      form.reset(); await loadBooks();
    } catch (err) { show("addBookMessage", err.message, true); }
  });

  document.getElementById("loadBookButton")?.addEventListener("click", async () => {
    const form = document.getElementById("updateBookForm");
    const id = form.elements.book_id.value;
    if (!id) return show("loadBookMessage", "Enter a Book ID.", true);
    try {
      const book = await request(`/api/books/${encodeURIComponent(id)}`);
      ["title","author","category","price","stock"].forEach(k => form.elements[k].value = book[k]);
      show("loadBookMessage", `Loaded: ${book.title}`);
    } catch (err) { show("loadBookMessage", err.message, true); }
  });

  document.getElementById("updateBookForm")?.addEventListener("submit", async e => {
    e.preventDefault();
    const form = e.currentTarget;
    const id = form.elements.book_id.value;
    const values = {};
    ["title","author","category","price","stock"].forEach(k => values[k] = form.elements[k].value);
    try {
      const result = await request(`/api/books/${encodeURIComponent(id)}`, {method:"PUT", body:JSON.stringify(values)});
      show("updateBookMessage", result.message); await loadBooks();
    } catch (err) { show("updateBookMessage", err.message, true); }
  });

  document.getElementById("deleteBookForm")?.addEventListener("submit", async e => {
    e.preventDefault();
    const form = e.currentTarget, id = form.elements.book_id.value;
    if (!confirm(`Delete Book ID ${id}? This cannot be undone.`)) return;
    try {
      const result = await request(`/api/books/${encodeURIComponent(id)}`, {method:"DELETE"});
      show("deleteBookMessage", result.message); form.reset(); await loadBooks();
    } catch (err) { show("deleteBookMessage", err.message, true); }
  });

  document.getElementById("contactForm")?.addEventListener("submit", e => {
    e.preventDefault();
    show("contactMessage", "Thanks! This demo validates the form; actual email delivery needs an email service.");
    e.currentTarget.reset();
  });

  document.addEventListener("click", e => {
    const button = e.target.closest("[data-book-id]");
    if (!button) return;
    const b = allBooks.find(item => Number(item.book_id) === Number(button.dataset.bookId));
    if (b) alert(`Book ID: ${b.book_id}\nTitle: ${b.title}\nAuthor: ${b.author}\nCategory: ${b.category}\nPrice: ₹${Number(b.price).toFixed(2)}\nStock: ${b.stock}`);
  });

  loadBooks();
});
