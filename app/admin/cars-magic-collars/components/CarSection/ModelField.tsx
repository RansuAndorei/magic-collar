import { CarFormType } from "@/utils/types";
import { Autocomplete } from "@mantine/core";
import { useMemo } from "react";
import { Control, Controller, useWatch } from "react-hook-form";

type Props = {
  control: Control<CarFormType>;
  modelList: Record<string, string[]>;
  error?: string;
};

const ModelField = ({ control, modelList, error }: Props) => {
  const selectedMake = useWatch({ control, name: "make" });
  const modelOptions = useMemo(() => modelList[selectedMake] ?? [], [modelList, selectedMake]);

  return (
    <Controller
      name="model"
      control={control}
      rules={{ required: "Model is required" }}
      render={({ field }) => (
        <Autocomplete label="Model" data={modelOptions} required error={error} {...field} />
      )}
    />
  );
};

export default ModelField;
