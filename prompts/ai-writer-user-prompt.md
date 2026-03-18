# AI Writer — User Prompt

> User prompt template for the article-writing LLM node in n8n.
> Variables shown as n8n expressions — the actual values are injected at runtime.

```
Write a Coolset Academy article on the following topic.

TOPIC: {{ $json.topic_input }}

TARGET KEYWORD: {{ $json.brief_json?.keyword || 'sustainability' }}

CONTENT BRIEF:
- Angle: {{ $json.brief_json?.angle || '' }}
- Audience: {{ $json.brief_json?.audience || $json.target_audience || 'Sustainability managers' }}
- Outline: {{ ($json.brief_json?.outline || []).join('\n  - ') }}
- Key points: {{ ($json.brief_json?.key_points || []).join('\n  - ') }}

ADDITIONAL CONTEXT FROM THE USER:
{{ $json.human_input || 'None provided' }}

Write the full article now in markdown. Do not use horizontal rules (---) to separate sections.

After the article, on a new line, provide a JSON block with metadata in this exact format:

---METADATA---
{
  "meta_description": "120–160 characters. Include the target keyword. No em dashes. Lead with the benefit, not what the article covers.",
  "keywords": ["keyword1", "keyword2", "keyword3"],
  "visual_suggestions": [
    {
      "type": "cover",
      "description": "Description of the hero/cover image",
      "placement": "top"
    },
    {
      "type": "supporting",
      "description": "Description of a diagram, infographic, or visual",
      "placement": "after section heading text"
    }
  ]
}

Include 1 cover visual and 2-3 supporting visuals. Each supporting visual's placement should reference a section heading from the article.
```
