import Link from "next/link";
import StoreMenu from "./StoreMenu";
import { AiFillCaretRight } from "react-icons/ai";
import { useRouter } from "next/router";
import { motion } from "framer-motion";

const linkHoverVariant = {
  initial: { x: 0 },
  transition: {
    duration: 0.2,
    type: "tween",
    ease: "easeInOut",
  },
  whileHover: {
    x: 3,
  },
};

const ConnectedList = () => {
  const { pathname } = useRouter();
  return (
    <ul className="mt-2">
      <motion.li
        variants={linkHoverVariant}
        initial="initial"
        whileHover="whileHover"
      >
        <Link
          href="/profile"
          className={`${
            pathname == "/cert/profile"
              ? "bg-primary hover:bg-primary"
              : "hover:text-primary "
          }`}
        >
          <AiFillCaretRight size={24} />
          <motion.div initial={{ x: 3 }} whileHover={{ x: -2 }}>
            My Profile
          </motion.div>
        </Link>
      </motion.li>
      {/* <motion.li
        variants={linkHoverVariant}
        initial="initial"
        whileHover="whileHover"
      >
        <Link
          href="/cert/profile/mycert"
          className={`${
            pathname == "/cert/profile/mycert"
              ? "bg-primary hover:bg-primary"
              : "hover:text-primary "
          }`}
        >
          <AiFillCaretRight size={24} />
          <motion.div initial={{ x: 3 }} whileHover={{ x: -2 }}>
            My Pedigrees
          </motion.div>
        </Link>
      </motion.li> */}
      {/* <motion.li
        variants={linkHoverVariant}
        initial="initial"
        whileHover="whileHover"
      >
        <Link
          href="/cert/profile/privilege"
          className={`${
            pathname == "/cert/profile/privilege"
              ? "bg-primary hover:bg-primary"
              : "hover:text-primary "
          }`}
        >
          <AiFillCaretRight size={24} />
          <motion.div initial={{ x: 3 }} whileHover={{ x: -2 }}>
            My Privilege
          </motion.div>
        </Link>
      </motion.li> */}
      {/* <motion.li
        variants={linkHoverVariant}
        initial="initial"
        whileHover="whileHover"
      >
        <Link
          href="/cert/profile/myfarm"
          className={`${
            pathname == "/cert/profile/myfarm"
              ? "bg-primary hover:bg-primary"
              : "hover:text-primary "
          }`}
        >
          <AiFillCaretRight size={24} />
          <motion.div initial={{ x: 3 }} whileHover={{ x: -2 }}>
            My Farm
          </motion.div>
        </Link>
      </motion.li> */}
      <li>{/* <StoreMenu /> */}</li>
    </ul>
  );
};

export default ConnectedList;
