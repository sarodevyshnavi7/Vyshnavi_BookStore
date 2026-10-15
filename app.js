
const express = require("express");
const mysql = require("mysql8");
const path = require("path");

const app = express();
const PORT = 3000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));

// MySQL database connection
const con = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "",
    database: "bookstore"
});

// Connect to database
con.connect(function (err) {
    if (err) {
        console.log("Database connection failed:", err.message);
        return;
    }

    console.log("Connected to bookstore database.");
});

// Home page
app.get("/", function (req, res) {
    res.sendFile(path.join(__dirname, "public", "index.html"));
});

// Get all books
app.get("/api/books", function (req, res) {
    con.query(
        "SELECT * FROM books ORDER BY book_id",
        function (err, rows) {
            if (err) {
                return res.status(500).json({ message: err.message });
            }

            res.json(rows);
        }
    );
});

// Get one book by ID
app.get("/api/books/:id", function (req, res) {
    con.query(
        "SELECT * FROM books WHERE book_id = ?",
        [req.params.id],
        function (err, rows) {
            if (err) {
                return res.status(500).json({ message: err.message });
            }

            if (rows.length === 0) {
                return res.status(404).json({
                    message: "Book not found."
                });
            }

            res.json(rows[0]);
        }
    );
});

// Add a book with manually entered Book ID
app.post("/api/books", function (req, res) {
    const { book_id, title, author, category, price, stock } = req.body;

    // Check required fields
    if (
        book_id === undefined || book_id === "" ||
        !title || !author || !category ||
        price === undefined || price === "" ||
        stock === undefined || stock === ""
    ) {
        return res.status(400).json({
            message: "Please fill in all fields."
        });
    }

    // Validate Book ID
    const id = Number(book_id);

    if (!Number.isSafeInteger(id) || id < 1) {
        return res.status(400).json({
            message: "Book ID must be a positive whole number."
        });
    }

    // Validate price and stock
    const bookPrice = Number(price);
    const bookStock = Number(stock);

    if (!Number.isFinite(bookPrice) || bookPrice < 0) {
        return res.status(400).json({
            message: "Please enter a valid price."
        });
    }

    if (
        !Number.isSafeInteger(bookStock) ||
        bookStock < 0
    ) {
        return res.status(400).json({
            message: "Stock must be a non-negative whole number."
        });
    }

    // Insert book including the manually entered ID
    const sql = `
        INSERT INTO books
        (book_id, title, author, category, price, stock)
        VALUES (?, ?, ?, ?, ?, ?)
    `;

    con.query(
        sql,
        [id, title.trim(), author.trim(), category.trim(), bookPrice, bookStock],
        function (err, result) {
            if (err) {
                if (err.code === "ER_DUP_ENTRY") {
                    return res.status(409).json({
                        message: "This Book ID already exists. Please enter a different ID."
                    });
                }

                return res.status(500).json({
                    message: err.message
                });
            }

            res.status(201).json({
                message: "Book added successfully!",
                book_id: id
            });
        }
    );
});

// Update a book
app.put("/api/books/:id", function (req, res) {
    const { title, author, category, price, stock } = req.body;

    if (
        !title || !author || !category ||
        price === undefined || price === "" ||
        stock === undefined || stock === ""
    ) {
        return res.status(400).json({
            message: "Please fill in all fields to update."
        });
    }

    const sql = `
        UPDATE books
        SET title = ?, author = ?, category = ?, price = ?, stock = ?
        WHERE book_id = ?
    `;

    con.query(
        sql,
        [title, author, category, price, stock, req.params.id],
        function (err, result) {
            if (err) {
                return res.status(500).json({ message: err.message });
            }

            if (result.affectedRows === 0) {
                return res.status(404).json({
                    message: "Book ID not found."
                });
            }

            res.json({ message: "Book updated successfully!" });
        }
    );
});

// Delete a book
app.delete("/api/books/:id", function (req, res) {
    con.query(
        "DELETE FROM books WHERE book_id = ?",
        [req.params.id],
        function (err, result) {
            if (err) {
                return res.status(500).json({ message: err.message });
            }

            if (result.affectedRows === 0) {
                return res.status(404).json({
                    message: "Book ID not found."
                });
            }

            res.json({ message: "Book deleted successfully!" });
        }
    );
});

// Start server
app.listen(PORT, function () {
    console.log(
        "Vyshnavi Books & Beyond running at http://localhost:" + PORT
    );
});
