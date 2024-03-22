# 👩‍💻 Job Scraper

> Web scraper using Playwright to collect information about job openings from various companies.

Scrapes data from the following company's careers pages:

| Company                                            | Status |
| -------------------------------------------------- | ------ |
| [Squarespace](https://www.squarespace.com/careers) | ✅     |
| [Stripe](https://stripe.com/jobs)                  | ✅     |
| [OpenAI](https://www.openai.com/careers)           | ✅     |
| [Pinterest](https://www.pinterestcareers.com/)     | ✅     |
| [Reddit](https://www.redditinc.com/careers)        | ✅     |
| Anthropic                                          | 🚧     |

> [!IMPORTANT]
> The data is filtered to only report jobs in the Dublin area since we don't care about jobs in other locations.

The jobs data is persisted in a [Gist](https://gist.github.com/rebeccarich/939866703c9699afe2c7806158345912). When the scraper runs the data is fetched and then diffed against the current job openings that are found. If a diff is detected an email is sent using [Courier](https://app.courier.com/assets/notifications/6XA45NXXD1MHJRGMKC6J3J5XNE63/design) showing any additions, deletions and updates. The Gist is then updated with the new data.

The scraper runs in a Github Action every morning at 8AM.
