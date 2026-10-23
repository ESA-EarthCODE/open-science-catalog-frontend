import CONFIG from "../merged-config.js";
import { escapeHtml } from "../utils/links.js";

export class OscForumTopics extends HTMLElement {
  constructor() {
    super();
    this._stac = null;
    this._topicData = null;
    this._fetchId = 0;
  }

  set stac(value) {
    const prevTitle = this._stac?.title;
    this._stac = value;
    if (!value || value.type !== "Collection" || !value.title) {
      this._topicData = null;
      this.render();
      return;
    }
    if (value.title !== prevTitle || !this._topicData) {
      this._fetchTopics(value.title);
    } else {
      this.render();
    }
  }

  get stac() {
    return this._stac;
  }

  async _fetchTopics(title) {
    const requestId = ++this._fetchId;
    const discourseRoot = CONFIG.discourseRoot || "https://discourse-earthcode.eox.at";
    try {
      const response = await fetch(
        `${discourseRoot}/search.json?q=${encodeURIComponent(title)}`
      );
      if (requestId !== this._fetchId) return;
      if (response.ok) {
        this._topicData = await response.json();
      } else {
        this._topicData = null;
      }
    } catch (error) {
      if (requestId !== this._fetchId) return;
      console.error("Failed to fetch forum topics:", error);
      this._topicData = null;
    }
    this.render();
  }

  _capitalize(s) {
    if (!s) return "";
    return String(s[0]).toUpperCase() + String(s).slice(1);
  }

  _uniqueAvatars(topicId) {
    const posts = Array.isArray(this._topicData?.posts) ? this._topicData.posts : [];
    return [
      ...new Set(
        posts
          .filter((p) => p.topic_id === topicId)
          .map((p) => p.avatar_template)
      ),
    ];
  }

  render() {
    if (!this._stac || this._stac.type !== "Collection" || !this._topicData) {
      this.innerHTML = "";
      return;
    }

    const discourseRoot = CONFIG.discourseRoot || "https://discourse-earthcode.eox.at";
    const topics = Array.isArray(this._topicData.topics) ? this._topicData.topics : [];
    const posts = Array.isArray(this._topicData.posts) ? this._topicData.posts : [];

    const topicsHtml = topics
      .map((topic) => {
        const title = escapeHtml(topic.unicode_title || topic.title || "");
        const excerpt = escapeHtml((topic.excerpt || "").replace("&hellip;", " ..."));
        const dateStr = topic.bumped_at
          ? escapeHtml(new Date(topic.bumped_at).toLocaleDateString())
          : "";
        const avatarsHtml = this._uniqueAvatars(topic.id)
          .map(
            (avatar) =>
              `<img src="${escapeHtml(discourseRoot + avatar.replace("{size}", "28"))}" alt="">`
          )
          .join("");
        const matchingPostsCount = posts.filter((p) => p.topic_id === topic.id).length;

        return `
          <li>
            <a href="${escapeHtml(`${discourseRoot}/t/${topic.slug}`)}" target="_blank" rel="noopener noreferrer">
              <span class="title">${title}</span>
              <span class="excerpt">${excerpt}</span>
              <span class="date">${dateStr}</span>
              <span class="posts">
                ${avatarsHtml}
                ${matchingPostsCount}
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                  <title>message-text-outline</title>
                  <path fill="#C2C8CC" d="M20,2A2,2 0 0,1 22,4V16A2,2 0 0,1 20,18H6L2,22V4C2,2.89 2.9,2 4,2H20M4,4V17.17L5.17,16H20V4H4M6,7H18V9H6V7M6,11H15V13H6V11Z" />
                </svg>
                ${escapeHtml(topic.posts_count ?? 0)}
              </span>
            </a>
          </li>
        `;
      })
      .join("");

    const oscTypeTag = this._capitalize(this._stac["osc:type"]);
    const keywordTags = Array.isArray(this._stac.keywords)
      ? this._stac.keywords.join(",")
      : "";
    const newTopicUrl = `${discourseRoot}/new-topic?title=${encodeURIComponent(
      this._stac.title || ""
    )}&category=data-workflows&tags=${encodeURIComponent(
      [oscTypeTag, keywordTags, "STAC"].filter(Boolean).join(",")
    )}`;

    this.innerHTML = `
      <section class="forum-topics mb-4">
        <h2>Related EarthCODE Forum Topics</h2>
        <div>
          <ul>${topicsHtml}</ul>
          <i>
            <span>${
              topics.length < 1
                ? "No related topics found?"
                : "Didn't find what you were looking for?"
            }</span>
            <a href="${escapeHtml(newTopicUrl)}" target="_blank" rel="noopener noreferrer">
              <strong>Start a new topic on the EarthCODE forum</strong>
            </a>!
          </i>
        </div>
      </section>
    `;
  }
}

if (typeof customElements !== "undefined" && !customElements.get("osc-forum-topics")) {
  customElements.define("osc-forum-topics", OscForumTopics);
}
