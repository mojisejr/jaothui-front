import Link from "next/link";
import { AiFillCaretRight } from "react-icons/ai";
const StoreMenu = () => {
  return (
    <>
      <details className="dropdown">
        <summary className="m-1 flex hover:text-primary">
          <AiFillCaretRight size={24} />
          <div>Store</div>
        </summary>
        <ul className="p-2 shadow-xl menu dropdown-content z-[1] text-primary bg-secondary rounded-box w-52">
          <li>
            <Link href="/store/arttoy">Arttoy</Link>
          </li>
          <li>
            <Link href="/store/food">Food</Link>
          </li>
          <li>
            <Link href="/store/non-food">Non-Food</Link>
          </li>
        </ul>
      </details>
    </>
  );
};

export default StoreMenu;
