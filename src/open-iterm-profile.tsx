import { execFileSync } from "child_process";
import { runAppleScript, getAvatarIcon } from "@raycast/utils";
import { Action, ActionPanel, Icon, List, closeMainWindow, popToRoot, showToast, Toast } from "@raycast/api";
import { useEffect, useState } from "react";

interface ItermProfile {
  name: string;
  guid: string;
}

function getItermProfiles(): ItermProfile[] {
  const script = `
import plistlib, json, sys

with open("${process.env.HOME}/Library/Preferences/com.googlecode.iterm2.plist", "rb") as f:
    plist = plistlib.load(f)

profiles = []
for p in plist.get("New Bookmarks", []):
    name = p.get("Name", "").strip()
    guid = p.get("Guid", "").strip()
    if name and guid:
        profiles.append({"name": name, "guid": guid})

print(json.dumps(profiles))
`;

  try {
    const output = execFileSync("/usr/bin/python3", ["-c", script], {
      encoding: "utf-8",
      maxBuffer: 10 * 1024 * 1024,
    });
    return JSON.parse(output.trim()) as ItermProfile[];
  } catch {
    return [];
  }
}

function appleScriptForProfile(profileName: string): string {
  const escaped = profileName.replace(/"/g, '\\"');
  return `
    tell application "iTerm2"
      launch
      repeat until application "iTerm2" is running
        delay 0.1
      end repeat
      create window with profile "${escaped}"
      activate
    end tell
  `;
}

export default function Command() {
  const [profiles, setProfiles] = useState<ItermProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setProfiles(getItermProfiles());
    setIsLoading(false);
  }, []);

  const openProfile = async (profile: ItermProfile) => {
    try {
      await runAppleScript(appleScriptForProfile(profile.name), { timeout: 10000 });
      await closeMainWindow();
      await popToRoot();
    } catch (e) {
      const error = e as Error;
      await showToast({
        style: Toast.Style.Failure,
        title: `Cannot open profile "${profile.name}"`,
        message: error.message,
      });
    }
  };

  return (
    <List isLoading={isLoading} searchBarPlaceholder="Search iTerm profiles...">
      {profiles.map((profile) => (
        <List.Item
          key={profile.guid}
          icon={getAvatarIcon(profile.name)}
          title={profile.name}
          actions={
            <ActionPanel>
              <Action title="Open in New Window" icon={Icon.Window} onAction={() => openProfile(profile)} />
            </ActionPanel>
          }
        />
      ))}
      {!isLoading && profiles.length === 0 && (
        <List.EmptyView
          icon={Icon.ExclamationMark}
          title="No profiles found"
          description="Could not find any iTerm profiles. Make sure iTerm2 is installed."
        />
      )}
    </List>
  );
}
