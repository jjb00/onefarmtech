# OneFarmTech search discovery setup

The website code is prepared for search discovery, but the owner must complete
the account and DNS steps below. Do not treat Search Console or Bing Webmaster
Tools as connected until their dashboards confirm verification.

## Google Search Console

1. Sign in to Google Search Console with the Google account that should own the
   property.
2. Choose **Add property**, select **Domain**, and enter `onefarmtech.com`
   without `https://` or a path.
3. Copy the Google verification TXT value.
4. In Cloudflare, open the `onefarmtech.com` zone, then **DNS > Records > Add
   record**.
5. Choose type **TXT**, use name `@`, paste the complete Google verification
   value into **Content**, leave TTL on **Auto**, and save.
6. Return to Search Console and select **Verify**. DNS propagation can take
   time; leave the TXT record in place after verification.
7. Open **Sitemaps**, submit `https://onefarmtech.com/sitemap.xml`, and confirm
   that its status becomes successful.
8. Use **URL inspection** for the homepage and core conversion pages. Confirm
   the inspected URL is canonical, crawlable and eligible for indexing, then
   request indexing after the production deployment is live.
9. Review **Indexing > Pages** for blocked, duplicate, redirected or discovered
   but unindexed URLs. Private URLs should not be indexed.
10. Review **Performance > Search results** after data starts accumulating,
    filtering by query, page, country and device. Use the findings to improve
    useful copy rather than repeating keywords.
11. Review **Security & Manual Actions > Manual actions** and **Security
    issues** after setup and periodically thereafter.

## Bing Webmaster Tools

1. Sign in to Bing Webmaster Tools with the account that should own the site.
2. Choose **Import** from Google Search Console after the Google property is
   verified, or add `onefarmtech.com` manually and complete DNS verification.
3. Confirm `https://onefarmtech.com/sitemap.xml` appears under **Sitemaps** and
   submit it if it was not imported.
4. Inspect the homepage and core conversion pages, then review indexing and
   search-performance reports after Bing has crawled the site.

## Future business profile linking

When an approved Google Business Profile exists, link it to the verified domain
and use the same organisation name and approved contact details as the site.
Do not add an unapproved address or service area to website metadata or
structured data.
