from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By
from selenium.webdriver.common.keys import Keys
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
import pandas as pd
import time
import os
from dotenv import load_dotenv
from query_variations import query_variations

def collect_x_data(query="Tamim ibn Hamad Al Thani", max_posts=20, max_comments=5, output_file="x_data.csv"):
    load_dotenv()
    username = os.getenv("X_USERNAME")
    password = os.getenv("X_PASSWORD")
    if not username or not password:
        raise ValueError("X_USERNAME and X_PASSWORD must be set in .env")

    options = Options()
    options.headless = False  # Keep False for debugging
    options.add_argument("--disable-blink-features=AutomationControlled")  # Avoid bot detection
    options.add_argument("user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36")
    options.add_argument("--no-sandbox")  # Additional evasion
    options.add_argument("--disable-dev-shm-usage")  # Stability on some systems
    driver = webdriver.Chrome(options=options)
    wait = WebDriverWait(driver, 10)
    try:
        # Login to X
        driver.get("https://x.com/login")
        print("Attempting login...")
        wait.until(EC.presence_of_element_located((By.NAME, "text"))).send_keys(username + Keys.RETURN)
        time.sleep(2)
        wait.until(EC.presence_of_element_located((By.NAME, "password"))).send_keys(password + Keys.RETURN)
        time.sleep(5)
        print("Initial login attempted. Current URL:", driver.current_url)

        # Handle verification step
        try:
            verification_field = wait.until(EC.presence_of_element_located((By.NAME, "text")))
            print("Verification step detected. Re-entering username...")
            verification_field.send_keys(username + Keys.RETURN)
            time.sleep(5)
            print("Verification submitted. Current URL:", driver.current_url)
        except:
            print("No verification step detected, proceeding...")

        # Check if login succeeded
        if "login" in driver.current_url:
            print("Login failed. Check credentials, CAPTCHA, or additional verification (e.g., SMS code).")
            print("Pausing for manual intervention. Solve any CAPTCHA or enter SMS code in the browser, then press Enter here.")
            input("Press Enter to continue after manual verification...")
            print("Resuming after manual input. Current URL:", driver.current_url)

        # Search with query
        url = f"https://x.com/search?q={query}&lang=en"
        driver.get(url)
        time.sleep(5)
        print(f"Searching X for '{query}'... Page title: {driver.title}")

        # Switch to "Latest" tab
        print("Switching to 'Latest' tab...")
        latest_tab = wait.until(EC.element_to_be_clickable((By.XPATH, "//span[text()='Latest']")))
        latest_tab.click()
        time.sleep(3)
        print("Switched to Latest tab. Current URL:", driver.current_url)

        post_data = []
        scrolls = 0
        while len(post_data) < max_posts and scrolls < 10:
            try:
                posts = wait.until(EC.presence_of_all_elements_located((By.CSS_SELECTOR, "div[data-testid='tweetText']")))
                print(f"Found {len(posts)} posts on scroll {scrolls + 1}")
                for post in posts[:max_posts - len(post_data)]:
                    try:
                        text = post.text or "unknown"
                        article = post.find_element(By.XPATH, "./ancestor::article")
                        date = (article.find_element(By.XPATH, ".//time").get_attribute("datetime") 
                                if article.find_elements(By.XPATH, ".//time") else "unknown")
                        retweets = (article.find_element(By.XPATH, ".//div[@data-testid='retweet']").text 
                                    if article.find_elements(By.XPATH, ".//div[@data-testid='retweet']") else "unknown")
                        likes = (article.find_element(By.XPATH, ".//div[@data-testid='like']").text 
                                 if article.find_elements(By.XPATH, ".//div[@data-testid='like']") else "unknown")
                        post_link = (article.find_element(By.XPATH, ".//a[@role='link'][.//time]").get_attribute("href") 
                                     if article.find_elements(By.XPATH, ".//a[@role='link'][.//time]") else "unknown")

                        if post_link != "unknown":
                            driver.execute_script("window.open(arguments[0]);", post_link)
                            driver.switch_to.window(driver.window_handles[1])
                            time.sleep(2)
                            comments = driver.find_elements(By.CSS_SELECTOR, "div[data-testid='tweetText']")[:max_comments]
                            comment_texts = [comment.text or "unknown" for comment in comments]
                            print(f"Post {post_link}: {len(comment_texts)} comments found")
                            driver.close()
                            driver.switch_to.window(driver.window_handles[0])
                        else:
                            comment_texts = ["none"]

                        post_data.append({
                            "source": "X", "platform": "X", "type": "post", "post_id": post_link.split("/")[-1] if post_link != "unknown" else "unknown",
                            "date": date, "text": text, "retweets": retweets, "likes": likes,
                            "user_location": "unknown", "country": "unknown", "comments": ";".join(comment_texts) or "none"
                        })
                    except Exception as e:
                        print(f"Error scraping post: {e}")
                        continue

                driver.execute_script("window.scrollTo(0, document.body.scrollHeight);")
                time.sleep(3)
                scrolls += 1
            except Exception as e:
                print(f"Error finding posts on scroll {scrolls + 1}: {e}")
                break

        df = pd.DataFrame(post_data)
        df.to_csv(output_file, index=False)
        print(f"Collected {len(post_data)} X posts with comments. Saved to '{output_file}'.")
    except Exception as e:
        print(f"Fatal error in X scraping: {e}")
    finally:
        driver.quit()

if __name__ == "__main__":
    os.chdir(os.path.dirname(os.path.abspath(__file__)))

    for query in query_variations:
        collect_x_data(query=query, output_file=f"x_data_{query.replace(' ', '_')}.csv")