import { MAX_FILE_SIZE } from "@/utils/constants";
import { CustomerPaymentChannel } from "@/utils/types";
import {
  ActionIcon,
  Alert,
  Badge,
  Button,
  Card,
  Collapse,
  CopyButton,
  FileInput,
  Group,
  Select,
  SimpleGrid,
  Stack,
  Text,
  Tooltip,
  UnstyledButton,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { notifications } from "@mantine/notifications";
import {
  IconCheck,
  IconChevronDown,
  IconCopy,
  IconInfoCircle,
  IconUpload,
} from "@tabler/icons-react";
import Image from "next/image";
import { Dispatch, SetStateAction } from "react";

type Props = {
  isSubmittingPayment: boolean;
  paymentChanneList: CustomerPaymentChannel[];
  paymentChannelId: string | null;
  setPaymentChannelId: Dispatch<SetStateAction<string | null>>;
  paymentProof: File | null;
  setPaymentProof: Dispatch<SetStateAction<File | null>>;
  handleSubmitPaymentProof: () => void;
};

const UploadPayment = ({
  isSubmittingPayment,
  paymentChanneList,
  paymentChannelId,
  setPaymentChannelId,
  paymentProof,
  setPaymentProof,
  handleSubmitPaymentProof,
}: Props) => {
  const [uploadOpen, { toggle: toggleUpload }] = useDisclosure(false);

  const selectedPaymentChannel = paymentChanneList.find(
    (channel) => channel.payment_channel_id === paymentChannelId,
  );

  return (
    <Stack gap={0}>
      <UnstyledButton
        onClick={toggleUpload}
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "12px 0",
          borderBottom: uploadOpen ? undefined : "1px solid var(--mantine-color-default-border)",
        }}
      >
        <Group gap="sm">
          <IconUpload size={18} />
          <Text fw={700}>Upload Payment Proof</Text>
        </Group>
        <IconChevronDown
          size={18}
          style={{
            transform: uploadOpen ? "rotate(180deg)" : "rotate(0deg)",
            transition: "transform 200ms ease",
            color: "var(--mantine-color-dimmed)",
          }}
        />
      </UnstyledButton>

      <Collapse expanded={uploadOpen}>
        <SimpleGrid cols={{ base: 1, md: 2 }} spacing="lg" pt="md">
          <Stack gap="md">
            <Select
              label="Payment channel"
              placeholder="Select channel"
              value={paymentChannelId}
              onChange={setPaymentChannelId}
              data={paymentChanneList.map((channel) => ({
                value: channel.payment_channel_id,
                label: `${channel.payment_channel_provider_name} - ${channel.payment_channel_account_name}`,
              }))}
              disabled={paymentChanneList.length === 0}
              clearable={false}
            />
            <FileInput
              label="Proof attachment"
              placeholder="Receipt image or PDF"
              value={paymentProof}
              onChange={(file) => {
                if (file && file.size > MAX_FILE_SIZE) {
                  notifications.show({
                    color: "red",
                    title: "File too large",
                    message: "Please upload a file smaller than 5 MB.",
                  });
                  return;
                }
                setPaymentProof(file);
              }}
              accept="image/png,image/jpeg,image/webp,application/pdf"
              leftSection={<IconUpload size={16} />}
              description="Maximum file size: 5 MB"
            />
            <Button
              leftSection={<IconUpload size={16} />}
              onClick={handleSubmitPaymentProof}
              loading={isSubmittingPayment}
              disabled={paymentChanneList.length === 0}
            >
              Submit
            </Button>
          </Stack>

          <Stack gap="md">
            <Text fw={700} size="sm" c="dimmed" tt="uppercase">
              Selected Payment Channel
            </Text>
            {selectedPaymentChannel ? (
              <Card withBorder p="md">
                <Stack gap="sm">
                  <Group justify="space-between" align="flex-start">
                    <Stack gap={6}>
                      <Text fw={700}>{selectedPaymentChannel.payment_channel_provider_name}</Text>

                      <Stack gap={2} mt="xs">
                        <Text size="xs" c="dimmed" tt="uppercase" fw={700}>
                          Account Name
                        </Text>
                        <Group gap="xs" align="center">
                          <Text size="sm">
                            {selectedPaymentChannel.payment_channel_account_name}
                          </Text>
                          <CopyButton value={selectedPaymentChannel.payment_channel_account_name}>
                            {({ copy, copied }) => (
                              <Tooltip
                                label={copied ? "Copied!" : "Copy"}
                                withArrow
                                position="right"
                              >
                                <ActionIcon
                                  size="xs"
                                  variant="subtle"
                                  color={copied ? "green" : "gray"}
                                  onClick={copy}
                                >
                                  {copied ? <IconCheck size={12} /> : <IconCopy size={12} />}
                                </ActionIcon>
                              </Tooltip>
                            )}
                          </CopyButton>
                        </Group>
                      </Stack>

                      <Stack gap={2}>
                        <Text size="xs" c="dimmed" tt="uppercase" fw={700}>
                          Account Number
                        </Text>
                        <Group gap="xs" align="center">
                          <Text size="sm">
                            {selectedPaymentChannel.payment_channel_account_identifier}
                          </Text>
                          <CopyButton
                            value={selectedPaymentChannel.payment_channel_account_identifier}
                          >
                            {({ copy, copied }) => (
                              <Tooltip
                                label={copied ? "Copied!" : "Copy"}
                                withArrow
                                position="right"
                              >
                                <ActionIcon
                                  size="xs"
                                  variant="subtle"
                                  color={copied ? "green" : "gray"}
                                  onClick={copy}
                                >
                                  {copied ? <IconCheck size={12} /> : <IconCopy size={12} />}
                                </ActionIcon>
                              </Tooltip>
                            )}
                          </CopyButton>
                        </Group>
                      </Stack>
                    </Stack>
                    <Badge color="green" variant="light">
                      Active
                    </Badge>
                  </Group>

                  {selectedPaymentChannel.payment_channel_qr_code_attachment?.attachment_path ? (
                    <Image
                      src={
                        selectedPaymentChannel.payment_channel_qr_code_attachment.attachment_path
                      }
                      alt={`${selectedPaymentChannel.payment_channel_provider_name} QR code`}
                      width={260}
                      height={260}
                      unoptimized
                      style={{
                        display: "block",
                        margin: "0 auto",
                        width: "auto",
                        height: "auto",
                        maxWidth: "100%",
                        maxHeight: 300,
                        borderRadius: "0.25rem",
                        marginTop: 12,
                      }}
                    />
                  ) : null}
                </Stack>
              </Card>
            ) : (
              <Alert
                icon={<IconInfoCircle size={16} />}
                title="Payment channel required"
                color="blue"
                variant="light"
              >
                Please select a payment channel to view the payment details and QR code.
              </Alert>
            )}
            {!paymentChanneList.length ? (
              <Alert color="yellow" title="No payment channel available">
                Please contact support before sending a payment.
              </Alert>
            ) : null}
          </Stack>
        </SimpleGrid>
      </Collapse>
    </Stack>
  );
};

export default UploadPayment;
