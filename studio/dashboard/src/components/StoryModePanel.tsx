import type { StoryModeSummary } from "../types";
import { fmtTimestamp } from "./Phase1PanelCommon";

interface StoryModePanelProps {
  story: StoryModeSummary | null | undefined;
}

interface StoryLineProps {
  icon: string;
  label: string;
  text: string;
}

function StoryLine({ icon, label, text }: StoryLineProps) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "28px 1fr",
        gap: 10,
        padding: "8px 0",
        borderBottom: "1px solid #1a2535",
      }}
    >
      <span style={{ fontSize: 16, lineHeight: "20px", textAlign: "center" }}>{icon}</span>
      <div>
        <span
          style={{
            display: "inline-block",
            fontSize: 11,
            fontWeight: 700,
            color: "#7a9cc0",
            textTransform: "uppercase",
            letterSpacing: "0.06em",
            marginBottom: 3,
          }}
        >
          {label}
        </span>
        <p
          style={{
            margin: 0,
            fontSize: 13,
            color: "#dbe8f7",
            lineHeight: 1.55,
          }}
        >
          {text}
        </p>
      </div>
    </div>
  );
}

export function StoryModePanel({ story }: StoryModePanelProps) {
  const isEmpty = !story;

  return (
    <section
      style={{
        border: "1px solid #2a3d55",
        borderRadius: 10,
        background: "#0d1828",
        padding: 12,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 10,
        }}
      >
        <h3 style={{ margin: 0, fontSize: 14, color: "#e9f0f8" }}>
          Story Mode
          <span
            style={{
              marginLeft: 8,
              fontSize: 11,
              color: "#4d7a99",
              fontWeight: 400,
            }}
          >
            what just happened, in plain language
          </span>
        </h3>
        {story?.generatedAt && (
          <span style={{ fontSize: 11, color: "#4d7a99" }}>
            {fmtTimestamp(story.generatedAt)}
          </span>
        )}
      </div>

      {isEmpty ? (
        <p
          style={{
            margin: 0,
            fontSize: 13,
            color: "#4d7a99",
            fontStyle: "italic",
          }}
        >
          No story yet. Run the proving scenario to generate one.
        </p>
      ) : (
        <div>
          <StoryLine icon="👁" label="I noticed…"          text={story.noticed} />
          <StoryLine icon="🔍" label="It looked like…"     text={story.lookedLike} />
          <StoryLine icon="⚡" label="I decided to…"       text={story.decided} />
          <StoryLine icon="✅" label="The result was…"     text={story.result} />
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "28px 1fr",
              gap: 10,
              paddingTop: 8,
            }}
          >
            <span style={{ fontSize: 16, lineHeight: "20px", textAlign: "center" }}>🔒</span>
            <div>
              <span
                style={{
                  display: "inline-block",
                  fontSize: 11,
                  fontWeight: 700,
                  color: "#7a9cc0",
                  textTransform: "uppercase",
                  letterSpacing: "0.06em",
                  marginBottom: 3,
                }}
              >
                I only took safe actions…
              </span>
              <p
                style={{
                  margin: 0,
                  fontSize: 13,
                  color: "#a8c4dc",
                  lineHeight: 1.55,
                  fontStyle: "italic",
                }}
              >
                {story.safetyNote}
              </p>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
