import { CartProvider } from "../context/CartContext";
import AppRouter from "./router";

export default function App() {
    return (
        <CartProvider>
            <AppRouter />
        </CartProvider>
    );
}