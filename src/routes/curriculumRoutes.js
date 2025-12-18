const express = require("express");
const router = express.Router();
const { 
    uploadCurriculum,
    getCurriculumSummary,
    getCurriculum,
    createCurriculum,
    getCurriculumById,
    updateCurriculum
} = require("../controllers/curriculumController");

router.post("/upload", uploadCurriculum);
router.get("/summary", getCurriculumSummary);
router.get("/get", getCurriculum);
router.post("/new", createCurriculum);
router.get("/:id", getCurriculumById);
router.put("/update/:id", updateCurriculum);

module.exports = router;
