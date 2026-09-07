import { app } from "./app.js";

const port = 3000;

app.listen(port, () => {
    console.log(
        `MRF Tyre Shop API is running at http://localhost:${port}`
    );
});