const fs = require('fs');
const path = require('path');
const express = require('express');
const csvParser = require('csv-parser');

const app = express();
const port = 8000;

const FILE_DIRECTORY = '/mihir_PV_dir';

app.use(express.json());

app.post('/process', async (req, res) => {
    const { file, product } = req.body;

    console.log("File Name 16 " + file);

    const extension = path.extname(file).toLowerCase();
    const filePath = path.join(FILE_DIRECTORY, file);
    console.log("File Path 20:  ", filePath);

    try {
        const { isValid, parsedData } = await processCSVFile(filePath);

        console.log("25");
        if (!isValid) {
            return res.status(400).json({
                file,
                error: "Input file not in CSV format."
            });
        }

        let sum = parsedData
            .filter(row => row.product === product)
            .reduce((acc, row) => acc + parseFloat(row.amount || 0), 0);

        console.log("37");    
        console.log(extension, sum, product);
        if (extension === '.yml' && sum === 0) {
            console.log("aay bhai....");
            return res.status(400).json({
                file,
                error: "Input file not in CSV format."
            });
        }

        console.log("Response about to be sent.");
        res.status(200).json({ file, sum });

    } catch (err) {
        console.error("Error:", err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

const expectedColumns = ["product", "amount"]; // Define expected columns

const processCSVFile = async (filePath) => {
    let parsedData = [];
    let isValid = true;

    const validateRow = (row) => {
        const rowKeys = Object.keys(row);

        // Validate column structure and ensure no spaces in product/amount fields
        const hasValidColumns = rowKeys.length === expectedColumns.length && expectedColumns.every(col => rowKeys.includes(col));
        const hasNoSpaces = row.product && row.amount && !/\s/.test(row.product) && !/\s/.test(row.amount);

        if (!hasValidColumns || !hasNoSpaces) {
            isValid = false;
        }

        parsedData.push(row);
    };

    try {
        await new Promise((resolve, reject) => {
            fs.createReadStream(filePath)
                .pipe(csvParser())
                .on("data", validateRow)
                .on("end", () => resolve())
                .on("error", reject);
        });

        return { isValid, parsedData };
    } catch (error) {
        console.error("File processing error:", error);
        return { isValid: false, parsedData: [] };
    }
};

app.listen(port, () => {
    console.log(`Server listening on port ${port}`);
});
