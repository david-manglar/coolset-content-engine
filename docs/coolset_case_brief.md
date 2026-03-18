# GTM Engineering, Marketing Case

## Introduction to Coolset

Welcome to the Coolset GTM Engineer case! We're excited to have you at this stage and look forward to seeing how you think and build.

Coolset is a sustainability management platform for mid-market companies in Europe. We help companies measure their carbon footprint, manage ESG compliance, and report on supply chain traceability – all in one platform. Our customers are typically companies with 20–2,000 employees in manufacturing, wholesale, professional services, and technology.

Our growth model is expertise-led and inbound. We publish in-depth content through our Academy, reports, guides, and webinars – positioning Coolset as the go-to resource for sustainability teams navigating complex regulations like the EUDR, PPWR and CSRD. When companies hit capacity or capability gaps, they turn to our software. Content is the engine that drives this, and it's where you come in.

## 🎯 The Challenge: Content Production System

Today, our content pipeline looks roughly like this:

1. **Topic ideation** — Marketing manually identifies topics based on gut feel, keyword research, and conversations with the commercial and research team. This goes into our Notion backlog.
2. **Briefing** — A content brief is written from scratch in Notion each time: target keyword, outline, angle, audience, internal links to include. LLMs are used, but sparingly.
3. **Drafting** — A draft is written (by our research team or by a freelancer) in Google Docs, then always reviewed by a domain expert from our research team for accuracy.
4. **Design** — Visual assets (graphics, diagrams, featured images) are manually created in Canva by marketing and go through their own review cycle.
5. **Publishing** — The final article is formatted in our CMS (Webflow), metadata is added, and it goes live. This is tedious, time-consuming and error-prone.
6. **Internal linking** — Someone manually checks which existing articles should link to the new piece, and which links should be added to the new article pointing to existing content. This is often skipped or done partially.
7. **Post-publish** — After publishing... not much. There's no structured process to monitor performance, update underperforming content, or iterate on what's working.

The result: each piece of content takes ~a week from idea to publish, involves 2-3 people, and once it's live, it's largely forgotten. There's very little experimentation, no systematic iteration, and too many manual dependencies slowing things down.

**Your challenge:** Build a prototype of an automated content production system that reimagines this pipeline end-to-end — from content brief creation through publishing and performance monitoring. There's no attachment to the tools currently used, apart from Webflow as the publishing destination. For context: we use Slack for internal comms, and are considering adopting Linear for marketing too (our research and engineering teams already run on it).

## 📦 Deliverables

We expect you to deliver two deliverables before our meeting.

### A. Working Prototype

Build a functional prototype that sketches the full content production pipeline. You can use any tools you like or feel comfortable with – Claude Code, n8n, Cursor, Make, custom scripts, APIs, or anything else. Most tools have free plans that should get you far enough. We primarily care about the deliverable, thinking and architecture.

Your prototype should cover:

- **Content brief generation** – Given a topic input, generate a structured content brief (target keyword, outline, angle, audience, key points to cover)
- **Draft creation** – From brief to article draft, aligned with Coolset's tone and style
- **Visual asset suggestions or generation** – Propose or generate supporting visuals for the content
- **CMS-ready output** – Output that's formatted and ready (or close to ready) to publish
- **Draft-to-CMS-to-production bridge** – Bridging the gap between a draft and publishable content with the right structure (H1, H2, quotes, links, images etc.)
- **Internal linking logic** – This should work both ways: the new article links to relevant existing content, AND existing articles get updated with links back to the new piece
- **Performance monitoring & iteration triggers** – A mechanism to track how content performs post-publish and flag when action is needed (e.g., content dropping in rankings, low engagement, optimization opportunities)

**Bonus: SEO tooling** – We encourage you to get creative with external tools and APIs. Think search console integrations, keyword research APIs, SERP analysis, competitor content monitoring. Both during content creation (keyword research, intent matching, content gap analysis) and post-publish (ranking tracking, identifying optimization opportunities). Show us what's possible. We have budget for tools, but also realize we're a startup unlikely to splurge €300/mo. on a manual SEO analysis tool when there's more affordable alternatives available at €20/mo.

### B. Strategic Write-up

A one-pager covering:

- **Measurement** – How would you measure the success of this system? What metrics matter?
- **Iteration** – How would you improve it over time? What would v2, v3 look like?
- **Scale** – How would you extend it to more products and more content types (guides, reports, webinars)?
- **Research team integration** – What does the domain expert's role look like in this new workflow? How do you preserve accuracy without creating bottlenecks?

## 🧭 Resources

No additional internal artifacts are provided. Resourcefulness is part of the assessment. Use publicly available resources to understand Coolset's voice, audience, and positioning:

- [coolset.com](https://www.coolset.com/) – Our website and product pages
- [Coolset Academy](https://www.coolset.com/academy) – Our existing content library
- [Coolset on LinkedIn](https://www.linkedin.com/company/coolset/) – Our social presence and tone of voice
- Published reports and guides on our website

## ⏱ Time Allocation

We recommend a maximum of **8 hours** to complete this case. You may distribute this time over several days as needed. Upon delivery, please share the total number of hours spent on the project. Please deliver the case before 22:00 on the day before your case interview.

To recap, what we expect you to share is:

- *A working prototype* – A functional system (public link or repo, perhaps with a short recording) that we can explore end-to-end: topic input → content brief → draft → visuals → CMS-ready output → internal linking → performance monitoring
- *Strategic write-up* – A one-pager on how you'd measure success, iterate, scale to more content types, and integrate the research team without creating bottlenecks

**Important framing:** We'd rather see an end-to-end system that *kind of* works across all steps than two steps that work perfectly. We want to understand how you think about the full pipeline. If not everything works optimally by the time cap, that's ok – show us what you built, what's working, and what your clear path is to strong performance when given more time if needed. Optimize for breadth of the prototype with a credible roadmap, not depth on a subset.

We *do* care a lot about your problem-solving ability. Show us what struggles you can work through. Everyone can create a plan, not everyone can build.

Lastly: don't worry if everything doesn't work perfectly on first try. We hire for slope, not intercept – we care most about a steep learning curve and the ability to work through problems. Show us how you think, debug, and iterate. That matters more than prior experience with any specific tool or process.

## 🔍 Evaluation

In the review session, we'll have a conversation about your work, where you'll explain your approach, architecture decisions, and how you'd take it further. This will be blended with Q&A to dive deeper into your technical and strategic choices, and 10 minutes to answer any questions you might have for us. We try to keep this interview to one hour, but please leave a bit of room in your schedule in case we run over.

## 🏆 Success Criteria

Your work will be evaluated on:

- **Technical capability** – Quality of the prototype, tool choices, and architecture thinking. Does the system work? Are the design decisions sound?
- **Marketing understanding** – Do you understand what makes content perform? Do your automation choices preserve content quality, or do they sacrifice it?
- **Strategic thinking** – Can you think beyond the prototype to measurement, iteration, and scaling? Is there a clear path from prototype to production? What else would you touch next?
- **Resourcefulness** – How well did you use public resources to understand Coolset's voice, audience, and positioning? Did you make smart choices about what to build vs. buy vs. skip? How 'real' does the outcome feel vs AI generated slop?

---

We're excited to see what you build and how you think about turning content into a growth engine. Our website and socials are a good source of reference, but please reach out with any questions – we're happy to support you. Good luck!
