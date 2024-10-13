const express = require("express");

const cors = require("cors");
const multer = require("multer");
const app = express();
app.use(express.json());

app.use(
  cors({
    origin: "http://localhost:3000", // Allow requests from this origin
  })
);
const PORT = process.env.PORT || 3004; // Use the PORT from the environment or fallback to 3004 for local development

// Your other middleware and routes here...

app.listen(PORT, () => {
    console.log(`Server listening at http://localhost:${PORT}`);
});

const { open } = require("sqlite");
const sqlite3 = require("sqlite3");

const path = require("path");
app.use("/uploads", express.static(path.join(__dirname, "uploads")));
// const { request } = require("https");
const dbpath = path.join(__dirname, "database.db");
let db;

const storage = multer.diskStorage({
  destination: "./uploads", // Specify the directory to store uploaded files
  filename: (req, file, cb) => {
    cb(
      null,
      file.fieldname + "-" + Date.now() + path.extname(file.originalname)
    );
  },
});

const upload = multer({ storage: storage });

const initializeConnection = async () => {
  try {
    db = await open({
      filename: dbpath,
      driver: sqlite3.Database,
    });

    
  } catch (e) {
    console.log(`The error message is ${e}`);
  }
};

initializeConnection();

app.post("/submit-form", upload.array("images"), async (req, res) => {
  const { name, socialMediaHandle } = req.body;
  if (!name || !socialMediaHandle || !req.files.length) {
    return res.status(400).json({ error: "All fields are required" });
  }

  const imageUrls = req.files.map((file) => `/uploads/${file.filename}`); // Construct image URLs

  try {
    const query = `
      INSERT INTO submissions (name, socialMediaHandle, images)
      VALUES (?, ?, ?)
    `;

    await db.run(query, [name, socialMediaHandle, JSON.stringify(imageUrls)]);

    res.status(200).json({ message: "Form submission successful" });
  } catch (error) {
    console.error("Error submitting data:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.get("/submissions", async (req, res) => {
  try {
    const { socialMedia } = req.query;

    let query = "SELECT * FROM submissions";

    
    const submissions = await db.all(query);
    res.json(submissions);
    console.log(submissions);
  } catch (err) {
    console.error("Error fetching submissions:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ... your existing backend code

app.get("/submissions/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const socialMediaHandle = id === 1 ? "FACEBOOK" : "INSTAGRAM";
    const query = `SELECT * FROM submissions WHERE socialMediaHandle = ?`;
    const submissions = await db.all(query, [socialMediaHandle]);
    res.json(submissions);
  } catch (err) {
    console.error("Error fetching submissions:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});
