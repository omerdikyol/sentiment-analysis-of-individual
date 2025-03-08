import streamlit as st
import pandas as pd
import matplotlib.pyplot as plt
import seaborn as sns
from wordcloud import WordCloud

# Load processed data
df = pd.read_csv("processed_data.csv")
df["date"] = pd.to_datetime(df["date"])
print("Data loaded successfully")

st.title("Sentiment Analysis Dashboard for Sheikh Tamim ibn Hamad Al Thani")

# Sidebar filters
st.sidebar.header("Filters")
start_date = st.sidebar.date_input("Start date", value=df["date"].min().date())
end_date = st.sidebar.date_input("End date", value=df["date"].max().date())
source_option = st.sidebar.selectbox("Select source", ["All", "Twitter", "News"])
print(f"Filters applied: start_date={start_date}, end_date={end_date}, source_option={source_option}")

# Filter data
filtered_df = df[(df["date"].dt.date >= start_date) & (df["date"].dt.date <= end_date)]
if source_option != "All":
    filtered_df = filtered_df[filtered_df["source"] == source_option]
print(f"Filtered data: {filtered_df.shape[0]} records")

# 1. Sentiment Overview
st.header("1. Sentiment Overview")

# Overall Sentiment Score
sentiment_counts = filtered_df["sentiment_label"].value_counts(normalize=True) * 100
overall_score = sentiment_counts.get("positive", 0)
st.subheader("Overall Sentiment Score")
st.write(f"Positive Sentiment: {overall_score:.2f}%")
print(f"Overall Sentiment Score: {overall_score:.2f}%")

# Sentiment Trend Over Time
st.subheader("Sentiment Trend Over Time")
daily_sentiment = filtered_df.groupby(filtered_df["date"].dt.date)["sentiment_score"].mean()
st.line_chart(daily_sentiment)
print("Sentiment Trend Over Time chart displayed")

# Sentiment Distribution
st.subheader("Sentiment Distribution")
fig, ax = plt.subplots()
sns.countplot(x="sentiment_label", data=filtered_df, order=["positive", "neutral", "negative"], ax=ax)
ax.set_xlabel("Sentiment")
ax.set_ylabel("Count")
st.pyplot(fig)
print("Sentiment Distribution chart displayed")

# 2. Content Analysis
st.header("2. Content Analysis")

# Post Sentiment Breakdown
st.subheader("Post Sentiment Breakdown")
st.dataframe(filtered_df[["text", "source", "date", "sentiment_label", "sentiment_score"]].head(10))
print("Post Sentiment Breakdown displayed")

# Top Positive and Negative Posts
st.subheader("Top Positive Posts")
top_positive = filtered_df[filtered_df["sentiment_label"] == "positive"].sort_values("sentiment_score", ascending=False).head(5)
st.table(top_positive[["text", "source", "sentiment_score"]])
print("Top Positive Posts displayed")

st.subheader("Top Negative Posts")
top_negative = filtered_df[filtered_df["sentiment_label"] == "negative"].sort_values("sentiment_score", ascending=False).head(5)
st.table(top_negative[["text", "source", "sentiment_score"]])
print("Top Negative Posts displayed")

# Keyword Sentiment Analysis (Word Cloud)
st.subheader("Keyword Sentiment Analysis")
positive_text = " ".join(filtered_df[filtered_df["sentiment_label"] == "positive"]["text"].astype(str))
if positive_text:
    wordcloud = WordCloud(width=800, height=400).generate(positive_text)
    plt.figure(figsize=(10, 5))
    plt.imshow(wordcloud, interpolation='bilinear')
    plt.axis("off")
    st.pyplot(plt)
    print("Word Cloud displayed")

# 3. Audience Reaction (Twitter only)
if source_option in ["All", "Twitter"]:
    st.header("3. Audience Reaction")
    twitter_df = filtered_df[filtered_df["source"] == "Twitter"]
    if not twitter_df.empty:
        st.subheader("Engagement Sentiment")
        fig, ax = plt.subplots()
        sns.scatterplot(x="retweets", y="sentiment_score", hue="sentiment_label", data=twitter_df, ax=ax)
        ax.set_xlabel("Retweets")
        ax.set_ylabel("Sentiment Score")
        st.pyplot(fig)
        print("Engagement Sentiment chart displayed")

# 4. Platform-Specific Insights
st.header("4. Platform-Specific Insights")
st.subheader("Sentiment by Platform")
platform_sentiment = filtered_df.groupby("source")["sentiment_label"].value_counts(normalize=True).unstack(fill_value=0) * 100
st.bar_chart(platform_sentiment)
print("Sentiment by Platform chart displayed")

# 5. Demographic Sentiment
st.header("5. Demographic Sentiment")
st.subheader("Location-Based Sentiment")
country_sentiment = filtered_df.groupby("country")["sentiment_label"].value_counts(normalize=True).unstack(fill_value=0) * 100
st.bar_chart(country_sentiment)
print("Location-Based Sentiment chart displayed")
