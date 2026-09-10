import { app } from "./app.js";
import { environment } from "./config/environment.js";

app.listen(environment.PORT, () => {
    console.log(
        `MRF Tyre Shop API is running at http://localhost:${environment.PORT}`
    );
});