
const mysql = require("mysql8");

const con = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "",
    database: "bookstore"
});

con.connect(function (err) {
    if (err) {
        console.error("Database connection failed:", err.message);
        return;
    }

    console.log("Connected to bookstore database!");
});

module.exports = con;
