"use Client";
import React from "react";
import styles from "./index.module.scss";
const Navigation = () => {
  return (
    <div>
      <div className={styles.search}>
        <input
          className={styles.search_input}
          type="text"
          placeholder="请搜索"
        />
        <div className={styles.search_icon}>
          <img
            alt="1"
            src="https://developer.mozilla.org/favicon-48x48.cbbd161b.png"
          />
        </div>
      </div>
    </div>
  );
};

export default Navigation;
