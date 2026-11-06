VYSHNAVI BOOKS & BEYOND

1. Copy the contents of this project into your D:\Book_store folder.
2. Keep your existing bookstore database and books table. Do not run duplicate INSERT statements.
3. Open app.js and replace YOUR_MYSQL_PASSWORD with your actual MySQL password.
   If your MySQL account has no password, use password: "".
4. From the D:\Book_store terminal, run:
   node app.js
5. Open http://localhost:3000 in your browser.

IMPORTANT ABOUT mysql8:
This project uses the require("mysql8") and mysql.createConnection/query callback style from the teacher's example. If you get "Cannot find module mysql8" or "mysql.createConnection is not a function", send the exact error screenshot. The npm package named mysql8 may not use the same API as the commonly used mysql package, so the installed package and teacher's sample need to match.

Expected books table columns:
book_id, title, author, category, price, stock

Pages:
index.html, books.html, add-book.html, update-book.html, delete-book.html, about.html, contact.html
CSS: public/css/style.css
JS: public/js/script.js

Contact form is a front-end demo and does not send actual email.
About page photo placeholder:
Put your photo at public/images/your-photo.jpg.
