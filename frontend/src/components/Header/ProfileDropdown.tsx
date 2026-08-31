"use client";

import { Avatar, Button, Divider, Dropdown } from "@kv-designsystem/react";
import { Buildings2Icon, LeaveIcon } from "@navikt/aksel-icons";
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
        data-color="neutral"
        className={className}
        popovertarget="profile-dropdown"
        onClick={posthogClick}
      >
        <Avatar aria-hidden data-size="xs" />
        {userName}
      </Button>
      <Dropdown id="profile-dropdown" data-color="neutral">
        <Dropdown.Heading>Velg profil</Dropdown.Heading>
        <Dropdown.List>
          <Dropdown.Item>
            <Dropdown.Button
              onClick={() =>
                trackClick("personal-profile", LOCATIONS.HeaderDropdown)
              }
            >
              <Avatar aria-hidden data-size="xs" />
              Frodo Baggins
            </Dropdown.Button>
          </Dropdown.Item>
          <Dropdown.Item>
            <Dropdown.Button
              onClick={() =>
                trackClick("organization-profile", LOCATIONS.HeaderDropdown)
              }
            >
              <Avatar aria-hidden data-size="xs" variant="square">
                <Buildings2Icon />
              </Avatar>
              Oslo kommune
            </Dropdown.Button>
          </Dropdown.Item>
        </Dropdown.List>
        <Divider />
        <Dropdown.List>
          <Dropdown.Item>
            <Dropdown.Button
              data-color="danger"
              onClick={() => trackClick("logout", LOCATIONS.HeaderDropdown)}
            >
              <LeaveIcon aria-hidden />
              Logg ut
            </Dropdown.Button>
          </Dropdown.Item>
        </Dropdown.List>
      </Dropdown>
    </>
  );
}
