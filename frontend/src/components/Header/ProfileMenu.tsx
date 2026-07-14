"use client";

import { Avatar, Divider, Dropdown } from "@kv-designsystem/react";
import { Buildings2Icon, LeaveIcon } from "@navikt/aksel-icons";

export function ProfileMenu({
  userName,
  className,
}: {
  userName: string;
  className?: string;
}) {
  return (
    <Dropdown.TriggerContext>
      <Dropdown.Trigger
        variant="tertiary"
        data-color="neutral"
        className={className}
      >
        <Avatar aria-hidden data-size="xs" />
        {userName}
      </Dropdown.Trigger>
      <Dropdown>
        <Dropdown.Heading>Velg profil</Dropdown.Heading>
        <Dropdown.List>
          <Dropdown.Item>
            <Dropdown.Button>
              <Avatar aria-hidden data-size="xs" data-color="neutral" />
              Frodo Baggins
            </Dropdown.Button>
          </Dropdown.Item>
          <Dropdown.Item>
            <Dropdown.Button>
              <Avatar
                aria-hidden
                data-size="xs"
                variant="square"
                data-color="neutral"
              >
                <Buildings2Icon />
              </Avatar>
              Oslo kommune
            </Dropdown.Button>
          </Dropdown.Item>
        </Dropdown.List>
        <Divider />
        <Dropdown.List>
          <Dropdown.Item>
            <Dropdown.Button>
              <LeaveIcon aria-hidden />
              Logg ut
            </Dropdown.Button>
          </Dropdown.Item>
        </Dropdown.List>
      </Dropdown>
    </Dropdown.TriggerContext>
  );
}
