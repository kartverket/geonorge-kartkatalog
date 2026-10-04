"use client";

import { Avatar, Button, Divider, Dropdown } from "@kv-designsystem/react";
import { LeaveIcon } from "@navikt/aksel-icons";
import { basePath } from "@/lib/basePath";
import { LOCATIONS, trackClick } from "@/posthog/posthog";

export function ProfileDropdown({
  userName,
  className,
  posthogClick,
}: {
  userName: string;
  className?: string;
  posthogClick: () => void;
}) {
  return (
    <>
      <Button
        variant="tertiary"
        className={className}
        popovertarget="profile-dropdown"
        onClick={posthogClick}
      >
        <Avatar aria-hidden data-size="xs" />
        {userName}
      </Button>
      <Dropdown id="profile-dropdown">
        <Dropdown.Heading>Profil</Dropdown.Heading>
        <Dropdown.List>
          <Dropdown.Item>
            <Dropdown.Button
              onClick={() =>
                trackClick("personal-profile", LOCATIONS.HeaderDropdown)
              }
            >
              <Avatar aria-hidden data-size="xs" />
              {userName}
            </Dropdown.Button>
          </Dropdown.Item>
        </Dropdown.List>
        <Divider />
        <Dropdown.List>
          <Dropdown.Item>
            <Dropdown.Button asChild data-color="danger">
              <a
                href={`${basePath}/api/auth/logout`}
                onClick={() => trackClick("logout", LOCATIONS.HeaderDropdown)}
              >
                <LeaveIcon aria-hidden />
                Logg ut
              </a>
            </Dropdown.Button>
          </Dropdown.Item>
        </Dropdown.List>
      </Dropdown>
    </>
  );
}
