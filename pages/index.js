import products from "../data/products";
import styles from "../styles/Home.module.css";

export default function Home() {
  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1>SnapCart 🛒</h1>
        <p>Your neighbourhood online store</p>
      </header>

      <main className={styles.main}>
        <h2>Products</h2>
        <div className={styles.grid}>
          {products.map((p) => (
            <div key={p.id} className={styles.card}>
              <div className={styles.category}>{p.category}</div>
              <h3>{p.name}</h3>
              <p className={styles.price}>${p.price.toFixed(2)}</p>
              <p className={styles.stock}>In stock: {p.stock}</p>
              <button className={styles.btn}>Add to Cart</button>
            </div>
          ))}
        </div>
      </main>

      <footer className={styles.footer}>
        <p>SnapCart © 2025 — Deployed by Jenkins — Jose Ruiz</p>
      </footer>
    </div>
  );
}
