import { ProductList } from "@/components/ProductList";

export default function HomePage() {
  return (
    <div>
      <h1 className="text-3xl font-bold mb-2">Products</h1>
      <p className="text-gray-600 mb-8">Browse our catalog</p>
      <ProductList />
    </div>
  );
}
