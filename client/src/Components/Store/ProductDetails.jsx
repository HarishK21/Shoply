import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
const ProductDetails = () => {
    const { id } = useParams();
    const [product, setProduct] = useState(null);

    useEffect(() => {
        fetch(`http://localhost:8080/api/product/${id}`)
            .then(res => res.json())
            .then(data => setProduct(data))
            .catch(err => console.error('Error fetching product:', err));
    }, [id]);

  return (
    <div className="product-details">
      <h2>{product.name}</h2>
      <p>{product.description}</p>
      <p>Price: ${product.price}</p>
    </div>
  );
}


export default ProductDetails;