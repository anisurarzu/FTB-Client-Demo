// components/TransactionMessage.js
import { motion } from "framer-motion";

const TransactionMessage = ({ message }) => {
  return (
    <motion.div
      initial={{ x: "100%" }}
      animate={{ x: "-100%" }}
      exit={{ x: "100%" }}
      transition={{
        type: "spring",
        stiffness: 100,
        damping: 25,
        duration: 15, // Duration of the animation (in seconds)
      }}
      className="fixed top-10 lg:top-16 right-0 p-4 bg-blue-500 text-white rounded-lg shadow-lg w-max">
      {message}
    </motion.div>
  );
};

export default TransactionMessage;
