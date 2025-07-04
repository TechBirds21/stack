/* -------------------------------------------------------------------------- */
/*  pages/client/AddAgent.tsx                                                 */
/* -------------------------------------------------------------------------- */
import React, { useEffect, useState } from 'react';
import {
  Eye,
  EyeOff,
  Loader2,
  Upload as UploadIcon,
  ImagePlus,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import DetailPageLayout from '@/layouts/DetailPageLayout';
import { authAPI, storageAPI } from '@/lib/api';
import { supabase } from '@/lib/supabase';

/* ------------------------------ Types ------------------------------------- */
interface Form {
  firstName: string;
  lastName: string;
  countryCode: string;
  state: string;
  city: string;
  mandal: string;
  email: string;
  password: string;
  phoneNumber: string;
  licenseNumber: string;
  agency: string;
  experience: string;
  image: File | null;
  verificationDocument: File | null;
  status: 'active' | 'inactive' | '';
}

interface Option {
  v: string;
  l: string;
}

/* -------------------------------------------------------------------------- */
/*  Component                                                                 */
/* -------------------------------------------------------------------------- */
const AddAgent: React.FC = () => {
  const nav = useNavigate();

  /* ----------------------- runtime lists from DB ------------------------ */
  const [countries, setCountries] = useState<Option[]>([]);
  const [states, setStates]       = useState<Option[]>([]);
  const [cities, setCities]       = useState<Option[]>([]);

  const loadCountries = async () => {
    const { data, error } = await supabase
      .from('countries')
      .select('phone_code, name')
      .order('name');
    if (!error && data) {
      setCountries(data.map((c) => ({ v: c.phone_code, l: `${c.name} (${c.phone_code})` })));
    }
  };

  const loadStates = async () => {
    const { data, error } = await supabase
      .from('states')
      .select('code, name')
      .order('name');
    if (!error && data) setStates(data.map((s) => ({ v: s.code, l: s.name })));
  };

  const loadCities = async (stateCode: string) => {
    if (!stateCode) return setCities([]);
    const { data, error } = await supabase
      .from('cities')
      .select('name')
      .eq('state_code', stateCode)
      .order('name');
    if (!error && data) setCities(data.map((c) => ({ v: c.name, l: c.name })));
  };

  useEffect(() => {
    loadCountries();
    loadStates();
  }, []);

  /* ----------------------------- form state ----------------------------- */
  const [form, setForm] = useState<Form>({
    firstName: '',
    lastName: '',
    countryCode: '',
    state: '',
    city: '',
    mandal: '',
    email: '',
    password: '',
    phoneNumber: '',
    licenseNumber: '',
    agency: '',
    experience: '',
    image: null,
    verificationDocument: null,
    status: '',
  });

  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);

  /* --------------------- change / file handlers ------------------------- */
  const onTxt = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const onFile = (
    e: React.ChangeEvent<HTMLInputElement>,
    key: keyof Pick<Form, 'image' | 'verificationDocument'>,
  ) => e.target.files?.[0] && setForm((f) => ({ ...f, [key]: e.target.files![0] }));

  /* when state changes –> refresh cities list */
  useEffect(() => {
    loadCities(form.state);
  }, [form.state]);

  /* ----------------------------- submit --------------------------------- */
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    setLoading(true);

    try {
      /* ---- upload files (if any) -------------------------------------- */
      const profileUrl =
        form.image &&
        (await storageAPI.uploadPublic(
          'profiles',
          `agents/${crypto.randomUUID()}_${form.image.name}`,
          form.image,
        ));

      const docUrl =
        form.verificationDocument &&
        (await storageAPI.uploadPublic(
          'documents',
          `agents/${crypto.randomUUID()}_${form.verificationDocument.name}`,
          form.verificationDocument,
        ));

      /* ---- register agent -------------------------------------------- */
      await authAPI.signUp({
        first_name: form.firstName,
        last_name: form.lastName,
        email: form.email,
        password: form.password,
        user_type: 'agent',
        phone_number: `${form.countryCode}${form.phoneNumber}`,
        license_number: form.licenseNumber,
        agency: form.agency,
        experience: Number(form.experience || 0),
        status: form.status || 'inactive',
        state: form.state,
        city: form.city,
        mandal: form.mandal,
        profile_image_url: profileUrl,
        verification_document_url: docUrl,
      });

      alert('Agent created successfully!');
      nav('/dashboard/manage-users/agents');
    } catch (err: any) {
      console.error(err);
      alert(err.message || 'Failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  /* ---------------------------------------------------------------------- */
  return (
    <DetailPageLayout title="Agents" breadcrumbs={['Agents', 'Add Agent']}>
      <form onSubmit={submit} className="p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* basic */}
          <Input label="First Name" name="firstName" val={form.firstName} onChange={onTxt} required />
          <Input label="Last Name"  name="lastName"  val={form.lastName}  onChange={onTxt} required />

          {/* phone */}
          <Select
            label="Country Code"
            name="countryCode"
            val={form.countryCode}
            onChange={onTxt}
            opts={[{ v: '', l: 'Select' }, ...countries]}
            required
          />
          <Input label="Phone Number" name="phoneNumber" val={form.phoneNumber} onChange={onTxt} type="tel" required />

          {/* location */}
          <Select
            label="State"
            name="state"
            val={form.state}
            onChange={onTxt}
            opts={[{ v: '', l: 'Select' }, ...states]}
            required
          />
          <Select
            label="City"
            name="city"
            val={form.city}
            onChange={onTxt}
            opts={[{ v: '', l: 'Select' }, ...cities]}
            required
          />
          <Input label="Mandal" name="mandal" val={form.mandal} onChange={onTxt} required />

          {/* credentials */}
          <Input label="Email" name="email" val={form.email} onChange={onTxt} type="email" required />
          <Password
            label="Password"
            name="password"
            val={form.password}
            onChange={onTxt}
            show={showPwd}
            toggle={() => setShowPwd(!showPwd)}
            required
          />

          {/* agent extras */}
          <Input label="Agency" name="agency" val={form.agency} onChange={onTxt} />
          <Input label="Experience (yrs)" name="experience" val={form.experience} onChange={onTxt} type="number" />
          <Input label="License Number" name="licenseNumber" val={form.licenseNumber} onChange={onTxt} />

          <Select
            label="Status"
            name="status"
            val={form.status}
            onChange={onTxt}
            opts={[
              { v: '', l: 'Select' },
              { v: 'active', l: 'Active' },
              { v: 'inactive', l: 'Inactive' },
            ]}
            required
          />

          {/* uploads */}
          <FileBox
            label="Profile Picture"
            file={form.image}
            accept="image/*"
            icon={<ImagePlus className="w-6 h-6" />}
            onChange={(e) => onFile(e, 'image')}
          />
          <FileBox
            label="Verification Document"
            file={form.verificationDocument}
            accept=".pdf,image/*"
            icon={<UploadIcon className="w-6 h-6" />}
            onChange={(e) => onFile(e, 'verificationDocument')}
          />
        </div>

        {/* actions */}
        <div className="flex gap-4">
          <button
            type="button"
            onClick={() => nav(-1)}
            className="px-6 py-2 bg-[#1E3A8A] text-white rounded-lg hover:bg-[#1E40AF] uppercase"
          >
            Back
          </button>

          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2 bg-[#22C55E] text-white rounded-lg hover:bg-[#16A34A] uppercase flex items-center gap-2 disabled:opacity-60"
          >
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            Submit
          </button>
        </div>
      </form>
    </DetailPageLayout>
  );
};

/* ========================================================================== */
/*  Small UI helpers                                                          */
/* ========================================================================== */
const Label = ({ txt, req }: { txt: string; req?: boolean }) => (
  <label className="block text-sm font-medium text-gray-600 mb-1">
    {txt} {req && <span className="text-red-500">*</span>}
  </label>
);

const Input = ({
  label,
  name,
  val,
  onChange,
  type = 'text',
  required = false,
}: {
  label: string;
  name: string;
  val: string;
  onChange: React.ChangeEventHandler<HTMLInputElement>;
  type?: string;
  required?: boolean;
}) => (
  <div>
    <Label txt={label} req={required} />
    <input
      type={type}
      name={name}
      value={val}
      onChange={onChange}
      required={required}
      className="w-full p-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
    />
  </div>
);

const Password = ({
  label,
  name,
  val,
  onChange,
  show,
  toggle,
  required = false,
}: {
  label: string;
  name: string;
  val: string;
  onChange: React.ChangeEventHandler<HTMLInputElement>;
  show: boolean;
  toggle: () => void;
  required?: boolean;
}) => (
  <div>
    <Label txt={label} req={required} />
    <div className="relative">
      <input
        type={show ? 'text' : 'password'}
        name={name}
        value={val}
        onChange={onChange}
        required={required}
        className="w-full p-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 pr-12"
      />
      <button
        type="button"
        onClick={toggle}
        className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
      >
        {show ? <EyeOff size={20} /> : <Eye size={20} />}
      </button>
    </div>
  </div>
);

const Select = ({
  label,
  name,
  val,
  onChange,
  opts,
  required = false,
}: {
  label: string;
  name: string;
  val: string;
  onChange: React.ChangeEventHandler<HTMLSelectElement>;
  opts: Option[];
  required?: boolean;
}) => (
  <div>
    <Label txt={label} req={required} />
    <select
      name={name}
      value={val}
      onChange={onChange}
      required={required}
      className="w-full p-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
    >
      {opts.map(({ v, l }) => (
        <option key={v} value={v}>
          {l}
        </option>
      ))}
    </select>
  </div>
);

const FileBox = ({
  label,
  file,
  accept,
  icon,
  onChange,
}: {
  label: string;
  file: File | null;
  accept: string;
  icon: React.ReactNode;
  onChange: React.ChangeEventHandler<HTMLInputElement>;
}) => (
  <div>
    <Label txt={label} />
    <label className="flex items-center justify-center h-32 w-full bg-[#1E3A8A] text-white rounded-lg cursor-pointer hover:bg-[#1E40AF] transition-colors">
      {file ? (
        <span className="text-sm truncate">{file.name}</span>
      ) : (
        <span className="flex items-center gap-2">
          {icon} <span className="text-sm">Choose File</span>
        </span>
      )}
      <input type="file" accept={accept} className="hidden" onChange={onChange} />
    </label>
  </div>
);

export default AddAgent;
