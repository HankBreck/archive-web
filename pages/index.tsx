import type { NextPage } from 'next'
import Link from 'next/link'

import styles from '../styles/Home.module.css'

const Index: NextPage = () => {

    return (
        <div className={styles.container}>
        {/* This will be our landing page. */}

            <Link href="signup">Create your account</Link>
        </div>
    )
}

export default Index
