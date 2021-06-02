import { createContext, ReactNode, useContext, useState } from 'react';
import { toast } from 'react-toastify';
import { api } from '../services/api';
import { Product, Stock } from '../types';

interface CartProviderProps {
  children: ReactNode;
}

interface UpdateProductAmount {
  productId: number;
  amount: number;
}

interface CartContextData {
  cart: Product[];
  addProduct: (productId: number) => Promise<void>;
  removeProduct: (productId: number) => void;
  updateProductAmount: ({ productId, amount }: UpdateProductAmount) => void;
}

const CartContext = createContext<CartContextData>({} as CartContextData);

export function CartProvider({ children }: CartProviderProps): JSX.Element {
  const [cart, setCart] = useState<Product[]>(() => {
    const storagedCart = localStorage.getItem('@RocketShoes:cart');

    if (storagedCart) {
      return JSON.parse(storagedCart);
    }

    return [];
  });

  const addProduct = async (productId: number) => {
    try {
      const { data: stock } = await api.get<Stock>(`/stock/${productId}`)

      if (stock.amount <= 0) {
        toast.error('Quantidade solicitada fora de estoque');
        return;
      }

      const productAdded = cart.find(product => productId === product.id);

      if (productAdded) {
        const updatedCart = cart.map(product => {
          if (productAdded.id === product.id) {
            return {
              ...product,
              amount: product.amount + 1
            }
          }

          return product;
        })

        setCart(updatedCart);

        localStorage.setItem('@RocketShoes:cart', JSON.stringify(updatedCart));

        return;
      }

      const { data: product } = await api.get<Product>(`/products/${productId}`);
      
      const newCart = [
        ...cart,
        {
          id: productId,
          title: product.title,
          price: product.price,
          image: product.image,
          amount: 1
        }
      ];

      setCart(newCart);

      localStorage.setItem('@RocketShoes:cart', JSON.stringify(newCart));
    } catch {
      toast.error('Erro na adição do produto');
    }
  };

  const removeProduct = (productId: number) => {
    try {
      const updatedCart = cart.filter(product => productId !== product.id);

      setCart(updatedCart);

      localStorage.setItem('@RocketShoes:cart', JSON.stringify(updatedCart));
    } catch {
      toast.error('Erro na remoção do produto');
    }
  };

  const updateProductAmount = async ({
    productId,
    amount,
  }: UpdateProductAmount) => {
    try {
      // TODO
    } catch {
      // TODO
    }
  };

  return (
    <CartContext.Provider
      value={{ cart, addProduct, removeProduct, updateProductAmount }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextData {
  const context = useContext(CartContext);

  return context;
}
