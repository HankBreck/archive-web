import { NextPage } from "next";
import { useRouter } from "next/router";

import styles from "../../styles/Home.module.css";

const SuccessPage: NextPage = () => {
    const router = useRouter()

    return (
        <div className={styles.main}>
            <h1>Copyright = Protected</h1>
            
            <p>Your legal contract will be finalized once all parties have signed with their ARC-H1VE wallets.</p>
        </div>
    )
}

export default SuccessPage