"use client";

import { TEXT_LIMITS } from "@/utils/constants";
import {
  Anchor,
  Box,
  Button,
  Card,
  Collapse,
  Container,
  Divider,
  Group,
  rem,
  Select,
  SimpleGrid,
  Stack,
  Text,
  Textarea,
  TextInput,
  ThemeIcon,
  Title,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import {
  IconBrandMessenger,
  IconChevronDown,
  IconChevronUp,
  IconMail,
  IconMapPin,
  IconMessageCircle,
  IconPhone,
  IconSend,
} from "@tabler/icons-react";
import { Controller, useForm } from "react-hook-form";

const CONTACT_INFO = [
  {
    icon: IconPhone,
    label: "Phone / Viber / WhatsApp",
    value: "+63 912 345 6789",
    href: "tel:+639123456789",
  },
  {
    icon: IconMail,
    label: "Email",
    value: "hello@magiccollar.ph",
    href: "mailto:hello@magiccollar.ph",
  },
  {
    icon: IconMapPin,
    label: "Address",
    value: "123 Auto Parts St., Quezon City, Metro Manila",
    href: "https://maps.google.com",
  },
  {
    icon: IconBrandMessenger,
    label: "Facebook Messenger",
    value: "Message us on Messenger",
    href: "https://m.me/magiccollarph",
  },
];

const INQUIRY_TYPES = [
  { value: "retail", label: "Retail Purchase" },
  { value: "reseller", label: "Reseller / Wholesale Inquiry" },
  { value: "fitment", label: "Fitment Question" },
  { value: "order", label: "Order / Delivery Status" },
  { value: "other", label: "Other" },
];

type FormValues = {
  name: string;
  email: string;
  phone: string;
  inquiryType: string;
  message: string;
};

const Contact = () => {
  const [formOpened, { toggle: toggleForm }] = useDisclosure(false);

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<FormValues>({
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      inquiryType: "",
      message: "",
    },
  });

  const onSubmit = (values: FormValues) => {
    console.log(values);
  };

  return (
    <Box
      id="contact"
      style={{ scrollMarginTop: 60 }}
      py={{ base: rem(60), md: rem(80) }}
      className="section-alt"
    >
      <Container size="sm">
        <Stack gap="xl">
          {/* Heading */}
          <Stack gap={4} style={{ textAlign: "center" }}>
            <Text size="sm" c="red.5" fw={700} tt="uppercase" style={{ letterSpacing: "0.1em" }}>
              Get in Touch
            </Text>
            <Title order={2} style={{ fontSize: rem(34), fontWeight: 700 }}>
              We'd Love to Hear From You
            </Title>
            <Text c="dimmed" size="md" maw={500} mx="auto">
              Reach out through any of the channels below, or send us a message directly.
            </Text>
          </Stack>

          <Card withBorder radius="md" p="xl">
            <Stack gap={0}>
              {/* Contact info rows */}
              {CONTACT_INFO.map(({ icon: Icon, label, value, href }, i) => (
                <Box key={label}>
                  <Group gap="md" py="md" align="center">
                    <ThemeIcon
                      size={40}
                      radius="md"
                      color="red"
                      variant="light"
                      style={{ flexShrink: 0 }}
                    >
                      <Icon size={20} />
                    </ThemeIcon>
                    <Stack gap={2} style={{ flex: 1 }}>
                      <Text
                        size="xs"
                        c="dimmed"
                        tt="uppercase"
                        fw={600}
                        style={{ letterSpacing: "0.06em" }}
                      >
                        {label}
                      </Text>
                      <Anchor
                        href={href}
                        size="sm"
                        fw={500}
                        c="inherit"
                        underline="hover"
                        target={href.startsWith("http") ? "_blank" : undefined}
                        rel={href.startsWith("http") ? "noopener noreferrer" : undefined}
                      >
                        {value}
                      </Anchor>
                    </Stack>
                  </Group>
                  {i < CONTACT_INFO.length - 1 && <Divider />}
                </Box>
              ))}

              <Divider mt="xs" />

              {/* Toggle button */}
              <Box pt="md">
                <Button
                  variant={formOpened ? "light" : "filled"}
                  color="red"
                  size="md"
                  leftSection={<IconMessageCircle size={18} />}
                  rightSection={
                    formOpened ? <IconChevronUp size={16} /> : <IconChevronDown size={16} />
                  }
                  onClick={toggleForm}
                  fullWidth
                >
                  {formOpened ? "Hide Message Form" : "Send Us a Message"}
                </Button>
              </Box>

              {/* Collapsible form */}
              <Collapse expanded={formOpened}>
                <form onSubmit={handleSubmit(onSubmit)}>
                  <Stack gap="md" pt="md">
                    <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
                      <TextInput
                        label="Full Name"
                        placeholder="John Doe"
                        required
                        error={errors.name?.message}
                        {...register("name", {
                          required: "Name is required",
                          minLength: { value: 2, message: "Name is too short" },
                        })}
                        maxLength={TEXT_LIMITS.medium}
                      />
                      <Controller
                        control={control}
                        name="phone"
                        rules={{
                          validate: {
                            checkNumberOfCharacter: (value) => {
                              const stringifiedValue = value ? `${value}` : "";
                              if (stringifiedValue.length !== 10) {
                                return "Invalid Phone Number";
                              }
                              return true;
                            },
                            startsWith: (value) => {
                              return `${value}`[0] === "9"
                                ? true
                                : "Phone number must start with 9";
                            },
                          },
                        }}
                        render={({ field: { onChange, value } }) => (
                          <TextInput
                            label="Phone Number"
                            placeholder="9123456789"
                            maxLength={10}
                            value={value ?? ""}
                            onChange={(e) => {
                              const value = e.currentTarget.value;
                              const numberOnly = value.replace(/\D/g, "");
                              if (numberOnly.length === 10) {
                                onChange(numberOnly);
                                return;
                              } else {
                                onChange(numberOnly);
                                return;
                              }
                            }}
                            error={errors.phone?.message}
                            leftSection={<Text size="sm">+63</Text>}
                          />
                        )}
                      />
                    </SimpleGrid>

                    <TextInput
                      label="Email"
                      placeholder="johndoe@email.com"
                      required
                      error={errors.email?.message}
                      {...register("email", {
                        required: "Email is required",
                        pattern: {
                          value: /^\S+@\S+\.\S+$/,
                          message: "Enter a valid email",
                        },
                      })}
                      maxLength={TEXT_LIMITS.medium}
                    />

                    <Controller
                      name="inquiryType"
                      control={control}
                      rules={{ required: "Please select an inquiry type" }}
                      render={({ field }) => (
                        <Select
                          label="Inquiry Type"
                          placeholder="Select a topic"
                          data={INQUIRY_TYPES}
                          required
                          error={errors.inquiryType?.message}
                          value={field.value}
                          onChange={field.onChange}
                          onBlur={field.onBlur}
                        />
                      )}
                    />

                    <Textarea
                      label="Message"
                      placeholder="Tell us your car make, model, and what you need..."
                      rows={5}
                      required
                      error={errors.message?.message}
                      {...register("message", {
                        required: "Message is required",
                        minLength: { value: 10, message: "Message is too short" },
                      })}
                    />

                    <Button
                      type="submit"
                      color="red"
                      size="md"
                      rightSection={<IconSend size={16} />}
                      fullWidth
                    >
                      Send Message
                    </Button>
                  </Stack>
                </form>
              </Collapse>
            </Stack>
          </Card>
        </Stack>
      </Container>
    </Box>
  );
};

export default Contact;
