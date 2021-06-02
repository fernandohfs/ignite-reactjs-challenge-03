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
      const { data: stock } = await api.get<Stock>(`/stock/${productId}`);

      if (stock.amount < 1) {
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

        await api.patch(`/stock/${productId}`, {
          amount: stock.amount - 1
        });

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

      await api.patch(`/stock/${productId}`, {
        amount: stock.amount - 1
      });
    } catch {
      toast.error('Erro na adição do produto');
    }
  };

  const removeProduct = async (productId: number) => {
    try {
      const product = cart.find(product => productId === product.id);

      if (!product) {
        toast.error('Erro na remoção do produto');
        return;
      }

      const updatedCart = cart.filter(product => productId !== product.id);

      setCart(updatedCart);

      localStorage.setItem('@RocketShoes:cart', JSON.stringify(updatedCart));

      await api.patch(`/stock/${productId}`, {
        amount: product?.amount
      });
    } catch {
      toast.error('Erro na remoção do produto');
    }
  };

  const updateProductAmount = async ({
    productId,
    amount,
  }: UpdateProductAmount) => {
    try {
      if (amount <= 0) {
        return;
      }

      const { data: stock } = await api.get<Stock>(`/stock/${productId}`)

      if (stock.amount < amount) {
        toast.error('Quantidade solicitada fora de estoque');
        return;
      }

      const updatedCart = cart.map(product => {
        if (productId === product.id) {
          return {
            ...product,
            amount
          }
        }

        return product;
      })

      setCart(updatedCart);

      localStorage.setItem('@RocketShoes:cart', JSON.stringify(updatedCart));
    } catch {
      toast.error('Erro na alteração de quantidade do produto');
    }
  };

  const updateProductAmountInStock = async (
    productId: number,
    type: 'increment' | 'decrement'): Promise<void> => {
    try {
      const { data: stock } = await api.get<Stock>(`/stock/${productId}`);

      const newAmount = type === 'increment' ? stock.amount + 1 : stock.amount - 1;

      await api.patch(`/stock/${productId}`, {
        amount: newAmount
      });
    } catch {
      toast.error('Erro ao decrementar a quantidade do produto no estoque');
    }
  }

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
